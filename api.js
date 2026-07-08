const API_URL = "https://script.google.com/macros/s/AKfycbx0jKU9vwdCzaauW_IyeG2PHuXJ9LbAvs6x20jjCsgIgB0X-_SqI5lgTFIF0thLPlAh/exec";

async function getHomeBaseData() {
  const response = await fetch(API_URL);
  return response.json();
}

async function addHomeBaseTransaction(transaction) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addTransaction",
      transaction
    })
  });

  return response.json();
}
