import iotroam from "../src/index.js";

const {devices} = iotroam({
    apiKey: process.env['X_API_KEY']!
});

async function main() {
    const device = await devices.create({
        name: 'test-device',
        owner: {
            type: 'group',
            id: 255
        },
        mac: '11-22-12-44-55-66',
        password: 'this-is-the-password',
        location: '123456790123456789012345678901'
    });
    console.log(device);

}

main().catch(console.error);
