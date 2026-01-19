import iotroam from "../src/index.js";

const {groups} = iotroam({
    apiKey: process.env['X_API_KEY']!
});


async function main() {
    const devices = await groups.devices({id: 255});
    console.log(devices);
}

main().catch(console.error);
