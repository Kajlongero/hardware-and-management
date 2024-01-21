const bcrypt = require('bcrypt')
const { randomUUID } = require('node:crypto');
const { verifyAndDecode, signToken, verifyAuth, signRecoveryToken, signChangePasswordToken } = require("../../functions/jwt.functions");
const { setTime } = require("../../functions/bcrypt.functions");
const { sendMail } = require("../../functions/send.mail");
const randomCode = require("../../functions/random.code");

const AuthResolver = {
  Query: {
    getCustomerByToken: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      const customer = await ctx.db.orm.customer.findUnique({
        where: {
          authId: user.sub, 
        },
        include: {  
          auth: true
        }
      });

      if(!customer)
        await ctx.error.notFound(customer, 'invalid customer token', { 
          type: 'ERROR_WITH_USER_AUTH', 
          description: 'invalid customer token',
          statusCode: 404,
          producedBy: 'USER',
          aditionalInfo: 'customer not found in database'
        });

      return customer;
    },
    getEmployeeByToken: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      const employee = await ctx.db.orm.employee.findUnique({
        where: {
          authId: user.sub,
          
        },
        include: {
          auth: true,
        }
      });

      if(!employee)
        await ctx.error.notFound(employee, 'invalid employee token', { 
          type: 'ERROR_WITH_USER_AUTH', 
          description: 'invalid employee token',
          statusCode: 404,
          producedBy: 'USER',
          aditionalInfo: 'employee not found in database'
        });

      return employee;
    }
  }, 
  Mutation: {
    customerLogin: async (_, { input }, ctx) => {
      const { user } = await ctx.authenticate('local-graphql-customer', input);
      
      return {
        token: signToken(user),
      };
    },
    employeeLogin: async (_, { input }, ctx) => {
      const { user } = await ctx.authenticate('local-graphql-employee', input);

      return {
        token: signToken(user),
      };
    },
    passwordChange: async (_, { authId, oldPassword, newPassword }, ctx) => {
      const user = await verifyAuth(ctx);

      if(user.role === 'CUSTOMER' && authId !== user.sub)
        throw new Error('unauthorized');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE' && user.sub !== authId)
        throw new Error('unauthorized');

      const userToChange = await ctx.db.orm.auth.findUnique({
        where: {
          id: authId,
        },
        select: {
          password: true,
        }
      });

      const comparePasswords = await bcrypt.compare(oldPassword, userToChange.password);

      if(!comparePasswords) throw new Error('old password invalid');

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await ctx.db.orm.auth.update({
        where: {
          email,
        },
        data: {
          password: hashedPassword,
        }
      });

      return "password changed successfully";
    },
    customerChangeEmail: async (_, { authId, email }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'ADMIN');
  
      if(user.role === 'CUSTOMER' && user.sub !== authId) 
        throw new Error('unauthorized');
  
      const checkDisponibility = await ctx.db.orm.auth.findUnique({
        where: {
          email,
        }
      });
      if(checkDisponibility) throw new Error('email already used');
  
      const changedEmail = await ctx.db.orm.auth.update({
        where: {
          id: authId,
        },
        data: {
          email: email,
        },
        select: {
          email: true,
        }
      });
  
      return changedEmail.email;
    },
    employeeChangeEmail: async (_, { authId, email }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');
  
      if(user.role === 'EMPLOYEE' && user.sub !== authId) 
        throw new Error('unauthorized');
  
      if(isOnList(user.role, 'OWNER', 'ADMIN') && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');
  
      const checkDisponibility = await ctx.db.orm.auth.findUnique({
        where: {
          email,
        }
      });
      if(checkDisponibility) throw new Error('email already used');
  
      const changedEmail = await ctx.db.orm.auth.update({
        where: {
          id: authId,
        },
        data: {
          email: email,
        },
        select: {
          email: true,
        }
      });
  
      return changedEmail.email;
    },
    recoveryPasswordCode: async (_, { email }, ctx) => {
      const code = randomCode();
      const message = "Please check your email for the confirmation code if it exists in our records.";

      const emailExists = await ctx.db.orm.auth.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          attemptsToResetPassword: true,
          timeToResetPasswordAgain: true,
        }
      });
      if(!emailExists) 
        throw new Error(message);

      const actual = new Date();
      const nextTime = new Date(emailExists.timeToResetPasswordAgain);

      if(actual < nextTime) 
        throw new Error(`you need to wait ${nextTime.getMinutes()} minutes to request a new code`)

      const uuid = randomUUID();

      const createToken = signRecoveryToken({
        sub: uuid,
        authId: emailExists.id,
        aud: 'authorizeChangePassword',
      });

      const nextToken = signChangePasswordToken({
        sub: emailExists.id,
        code: emailExists.code,
        rtkid: uuid,
        aud: 'changePasswordAuthorized',
      })

      await ctx.db.orm.$transaction(async (tx) => {
        await tx.auth.update({
          where: {
            id: emailExists.id,
          },
          data: {
            attemptsToResetPassword: {
              increment: 1,
            },
            timeToResetPasswordAgain: setTime({ 
              attempts: emailExists.attemptsToResetPassword + 1,
              time: emailExists.timeToResetPasswordAgain ? emailExists.timeToResetPasswordAgain : null,
            }, 3),
          }
        })
  
        await tx.authRecovery.create({
          data: {
            id: uuid,
            resetCode: code,
            token: nextToken,
            authId: emailExists.id,
          }
        });
      });

      return {
        token: createToken,
      };
    },
    verifyCode: async (_, { code }, ctx) => {
      const authorizeToken = ctx.req.headers['x-reset-password-token'];
      const token = verifyAndDecode(authorizeToken);

      if(token.message && token.message.toLowerCase() === 'token expired')
        throw new Error('Token expired, please try again');

      if(token.message && token.message.toLowerCase() === 'error validating the token')
        throw new Error('Error validating the Token, please try again');

      if(token.aud !== 'authorizeChangePassword')
        throw new Error('this token is not valid for this action');

      const findEmail = await ctx.db.orm.authRecovery.findUnique({
        where: {
          id: token.sub,
        },
        select: {
          token: true,
          resetCode: true,
          isValid: true,
          attemptsMade: true,
          authId: true,
        }
      });

      if(!findEmail.isValid)
        throw new Error('please request another reset code');

      if(code !== findEmail.resetCode)  
        await ctx.db.orm.authRecovery.update({
          where: {
            id: token.sub,
          },
          data: {
            attemptsMade: {
              increment: 1,
            },
            isValid: findEmail.attemptsMade + 1 >= 5 ? false : undefined,
          }
        });

      await ctx.db.orm.authRecovery.deleteMany({
        where: {
          authId: findEmail.authId,
        }
      });

      return {
        token: findEmail.token,
      }
    },
    changePassword: async (_, { newPassword }, ctx) => {
      const authorizeToken = ctx.req.headers['x-authorized-reset-password-token'];
      const token = verifyAndDecode(authorizeToken);

      if(token.message && token.message.toLowerCase() === 'token expired')
        throw new Error('Token expired, please try again');

      if(token.message && token.message.toLowerCase() === 'error validating the token')
        throw new Error('Error validating the Token, please try again');

      if(token.aud !== 'changePasswordAuthorized')
        throw new Error('this token is not valid for this action');

      const hashPassword = await bcrypt.hash(newPassword, 10);

      const { role } = await ctx.db.orm.auth.update({
        where: {
          id: token.sub,
        },
        data: {
          password: hashPassword,
          
        },
        select: {
          role: true,
        }
      });

      const dataToToken = await ctx.db.orm[`${role.toLowerCase()}`].findUnique({
        where: {
          authId: token.sub
        },
        select: {
          id: true,
          [role === 'EMPLOYEE' ? 'charge' : undefined]: role === 'EMPLOYEE' ? true : undefined,
          auth: {
            select: {
              id: true,
              role: true,
            }
          }
        }
      });

      await ctx.db.orm.auth.update({
        where: {
          id: token.sub,
        },
        data: {
          attemptsToResetPassword: 0,
          timeToResetPasswordAgain: null,
          loginAttempts: 0,
          timeToLoginAgain: null, 
        }
      })
      
      const newToken = signToken(dataToToken);
      return { token: newToken };
    },
  },
}

module.exports = AuthResolver;