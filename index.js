const { File, Authorize, InitAPI, Territory } = require("cess-js-sdk-nodejs");

const Mnemonic = "crazy better imitate okay slight security clay arena hip grunt wisdom rare";
const MyAddress = "cXjt4f9k7P7tDv6vufpJS6xqGzhrUJucm61VcA4ncFi4kJHoh";
const TerritoryName = "t1";

const { join: joinPath, resolve: resolvePath } = require("node:path");
const LICENSE_PATH = resolvePath(joinPath(__dirname, "image.png"));

const config = {
    nodeURL: [
        "wss://testnet-rpc1.cess.cloud/ws/",
        "wss://testnet-rpc.cess.network/ws/"
    ],
    gatewayURL: "http://144.202.102.112:8080",
    gatewayAddr: "cXkgC4C3EThfD8faAStcthdEL6tCoMGevGac4XnFBSjF8nQ1m",
    keyringOption: { type: "sr25519", ss58Format: 11330 }
};

async function main() {
    const { api, keyring } = await InitAPI(config);

    // Authorize Gateway
    console.log("Checking if Gateway is Authorized...");
    const cessAuth = new Authorize(api, keyring);
    let result = await cessAuth.authorityList(MyAddress);
    if (result.msg === "ok") {
        if (!result.data.includes(config.gatewayAddr)) {
            console.log("------> Authorizing Gateway", config.gatewayAddr);
            result = await cessAuth.authorize(Mnemonic, config.gatewayAddr);
        } else {
            console.log(config.gatewayAddr, "already Authorized");
        }
    } else {
        console.error("Error:", result);
        return;
    }

    // Create Territory
    const territory = new Territory(api, keyring, true);
    result = await territory.queryMyTerritorys(MyAddress);
    let territoryExists = false;
    for (let i = 0; i < result.data.length; i++) {
        const element = result.data[i];
        if (element.name == TerritoryName) {
            console.log("------> Territory Exists", element);
            territoryExists = true;
            break;
        }
    }
    if (!territoryExists) {
        console.log("------> Creating new Territory:", config.gatewayAddr);
        result = await territory.createTerritory(Mnemonic, TerritoryName, 1, 30, console.log);
        console.log(result, "\n");
    }


    // Upload File
    console.log("------> Uploading File...", LICENSE_PATH);
    const cessFile = new File(api, keyring, config.gatewayURL, true);

    result = await cessFile.uploadFile(
        Mnemonic,
        LICENSE_PATH,
        TerritoryName,
        (status) => console.log("Status: ", status)
    );
    console.log("------> Result:", result);

    const fileId = result.data.fid;
    console.log("------> File Uploaded Successfully:", fileId);

    // Download File
    console.log("------> Downloading File...");
    let path = joinPath(__dirname, "123.png");
    console.log("Download File Path: ", path);
    result = await cessFile.downloadFile(fileId, path);
    if (result.msg === "ok") {
        console.log("File downloaded", result);
    } else {
        console.log("Error: ", result);
    }
}

main()
    .catch(console.error)
    .finally(() => process.exit());