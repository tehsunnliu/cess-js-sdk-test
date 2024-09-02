const { File, Authorize, InitAPI, Territory } = require("cess-js-sdk-nodejs");

const Mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk";
const MyAddress = "cXgaee2N8E77JJv9gdsGAckv1Qsf3hqWYf7NL4q6ZuQzuAUtB";
const TerritoryName = "t2";
const BucketName = "jsbucket";

const { join: joinPath, resolve: resolvePath } = require("node:path");
const LICENSE_PATH = resolvePath(joinPath(__dirname, "LICENSE.txt"));

const config = {
    nodeURL: [
        "wss://testnet-rpc1.cess.cloud/ws/",
        "wss://testnet-rpc.cess.network/ws/"
    ],
    gatewayURL: "https://deoss-sgp.cess.network",
    gatewayAddr: "cXf3X3ugTnivQA9iDRYmLNzxSqybgDtpStBjFcBZEoH33UVaz",
    keyringOption: { type: "sr25519", ss58Format: 11330 }
};

async function main() {
    const { api, keyring } = await InitAPI(config);

    // Authorize Gateway
    console.log("Authorizing Gateway...");
    const cessAuth = new Authorize(api, keyring);
    let result = await cessAuth.authorityList(MyAddress);
    if (result.msg === "ok") {
        if (!result.data.includes(config.gatewayAddr)) {
            console.log("Authorizing Gateway", config.gatewayAddr);
            result = await cessAuth.authorize(Mnemonic, config.gatewayAddr);
        } else {
            console.log(config.gatewayAddr, "Authorized");
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
            console.log("Territory Exists", element);
            territoryExists = true;
            break;
        }
    }
    if (!territoryExists) {
        console.log("createTerritory:", config.gatewayAddr);
        result = await territory.createTerritory(Mnemonic, TerritoryName, 10, 30, console.log);
        console.log(result, "\n");
    }


    // Upload File
    console.log("Uploading File...", LICENSE_PATH);
    const cessFile = new File(api, keyring, config.gatewayURL, true);


    result = await cessFile.uploadFile(
        Mnemonic,
        LICENSE_PATH,
        TerritoryName,
        (status) => console.log("Status: ", status)
    );

    console.log("Result:", result);

    const fileId = result.fid;
    console.log("File Uploaded Successfully:", fileId);

    // Download File
    console.log("Downloading File...");
    let path = joinPath(__dirname, "123.txt");
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