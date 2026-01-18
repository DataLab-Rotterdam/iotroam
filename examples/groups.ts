import iotroam from "../src";

const {groups} = iotroam({
    apiKey: process.env['X_API_KEY']!
});

async function main() {
    const _groups = await groups.list();
    console.log(_groups);
}

main().catch(console.error);
