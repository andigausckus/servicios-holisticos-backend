const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "2028838",
  key: "495b1e4631e1fe038642",
  secret: "3f820a899d4ee43aa087",
  cluster: "sa1",
  useTLS: true,
});

module.exports = pusher;