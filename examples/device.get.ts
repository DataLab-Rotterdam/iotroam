import iotroam from "../src";

const {devices} = iotroam({
    apiKey: process.env['X_API_KEY']!
});

async function main() {
    const device = await devices.get({id: 17496});
    console.log(device);
}

main().catch(console.error);
