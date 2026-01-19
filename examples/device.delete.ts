import iotroam from "../src/index.js";

const {devices} = iotroam({
    apiKey: process.env['X_API_KEY']!
});

async function main() {
    const device = await devices.delete({id: 41790});
    console.log(device);

}

main().catch(console.error);
