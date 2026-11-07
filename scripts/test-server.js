const app = require('../index');
const prisma = require('../lib/prisma');
const server = app.listen(0, '127.0.0.1', () => {
  process.send({ port: server.address().port });
});
process.on('message', (message) => {
  if (message === 'shutdown') server.close(async () => {
    await prisma.$disconnect();
    process.exit();
  });
});
