const amqp = require('amqplib');

exports.connectToRabbitMQ = async () => {
    try {
        const connection = await amqp.connect('amqps://bincjowu:HhJ6_9oD03bU32YbxVnmG0MFvN1-v3-8@sparrow.rmq.cloudamqp.com/bincjowu');
        const channel = await connection.createChannel();
        const channel2 = await connection.createChannel();
        await channel.assertQueue('test1');
        await channel2.assertQueue('test2');
        channel.consume('test1', (msg) => {
            if (msg.content) {
                const message = msg.content.toJSON();
                console.log('Received message:', message);

                channel.ack(msg); 
            }
        }, { noAck: false });

        channel2.consume('test2', (msg) => {
            if (msg.content) {
                const message = msg.content.toString();
                console.log('Received message:', message);

                channel.ack(msg); 
            }
        }, { noAck: false });

        // Error handling
        connection.on('error', (err) => {
            console.error('Connection error:', err.message);
        });

        channel.on('error', (err) => {
            console.error('Channel error:', err.message);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}
