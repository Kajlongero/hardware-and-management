class MotherGlobalClass {

  constructor(connection, tablename) {
    this.connection = connection;
    this.tablename = tablename;
  }

  async many(params = {}) {
    const data = await this.connection[this.tablename].findMany({
      ...params,
    });

    return data;
  }

  async unique( conditions, params ) {
    const data = await this.connection[this.tablename].findMany({
      where: {
        ...conditions
      }
      ...params,
    });

    return data;
  }

  async create(data) {
    const created = await this.connection[this.tablename].create({
      data: {
        ...data,
      },
      skipDuplicates,
    });

    return created;
  }

  async createMany(data, skipDuplicates = false) {
    const created = await this.connection[this.tablename].createMany({
      data: {
        ...data,
      },
      skipDuplicates
    });

    return created;
  }

  async update(conditions = {}, data, params = {}) {
    const updated = await this.connection[this.tablename].update({
      where: {
        ...conditions,
      },
      data: {
        ...data,
      },
      ...params
    });

    return updated;
  }

  async delete(conditions) {
    const deleted = await this.connection[this.tablename].delete({
      where: {
        ...conditions,
      },
    });

    return deleted;
  }

  async deleteMany(conditions) {
    const deleted = await this.connection[this.tablename].deleteMany({
      where: {
        ...conditions,
      },
    });

    return deleted;
  }

}

class GlobalClass extends MotherGlobalClass {
  constructor(connection, tablename) {
    super(connection, tablename);
  }
}

module.exports = GlobalClass;