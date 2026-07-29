import Fastify from 'fastify';
const app = Fastify({ logger: false });

app.get('/test1', async (request, reply) => {
    reply.status(400).send({ error: 'test1' });
    return reply;
});

app.get('/test2', async (request, reply) => {
    reply.status(400).send({ error: 'test2' });
    // return undefined
});

app.get('/test3', async (request, reply) => {
    return reply.status(400).send({ error: 'test3' });
});

app.listen({ port: 3001 }, async () => {
    try {
        console.log("Testing test1 (return reply)...");
        const res1 = await fetch('http://localhost:3001/test1');
        console.log("test1 status:", res1.status);
    } catch(e) { console.error("test1 failed", e.message); }

    try {
        console.log("Testing test2 (return undefined)...");
        const res2 = await fetch('http://localhost:3001/test2');
        console.log("test2 status:", res2.status);
    } catch(e) { console.error("test2 failed", e.message); }

    try {
        console.log("Testing test3 (return reply.send)...");
        const res3 = await fetch('http://localhost:3001/test3');
        console.log("test3 status:", res3.status);
    } catch(e) { console.error("test3 failed", e.message); }

    process.exit(0);
});
