const verifyProductRepeated = (data) => {
  let obj = {};
  let result = [];

  data.forEach(({ id, quantity }) => {
    if(obj[id]){
      obj[id] += quantity;
    }else{
      obj[id] = quantity;
    }
  });

  for(let [key, val] of Object.entries(obj)) {
    result.push({ id: key, quantity: val });
  }

  return result;
}

module.exports = { verifyProductRepeated };