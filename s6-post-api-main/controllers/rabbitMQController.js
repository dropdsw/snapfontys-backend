const amqp = require('amqplib');
const postCntrl = require('./postCtrl')

exports.connectToRabbitMQ = async () => {
    try {
        const connection = await amqp.connect('amqps://bincjowu:HhJ6_9oD03bU32YbxVnmG0MFvN1-v3-8@sparrow.rmq.cloudamqp.com/bincjowu');
        const channel = await connection.createChannel();
        const channel2 = await connection.createChannel();
        const channel3 = await connection.createChannel();
        const channel4 = await connection.createChannel();
        const channel5 = await connection.createChannel();
        const channel6 = await connection.createChannel();
        await channel.assertQueue('createPost');
        await channel2.assertQueue('deletePost');
        await channel3.assertQueue('likePost');
        await channel4.assertQueue('unLikePost');
        await channel5.assertQueue('createComment');
        await channel6.assertQueue('deleteComment');
        await channel6.assertQueue('deleteComments');
        await channel6.assertQueue('savePost');
        await channel6.assertQueue('unSavePost');
        channel.consume('createPost', (msg) => {
            if (msg.content) {
                const message = msg.content.toString();
                postCntrl.createPost(JSON.parse(message), {});
                channel.ack(msg); 
            }
        }, { noAck: false });

        channel2.consume('deletePost', (msg) => {
            if (msg.content) {
                const message = msg.content.toString();
                postCntrl.deletePost(JSON.parse(message), {});

                channel2.ack(msg); 
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
