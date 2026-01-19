import iotroam from "../src/index.js";

const {devices} = iotroam({
    apiKey: process.env['X_API_KEY']!
});


async function main() {
    const device = await devices.update({id: 10}, {name: "new-test-device-name"})
    console.log(device);
}

main().catch(console.error);
