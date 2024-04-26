const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractFile = 'BondAuctionFactory.sol';
const contractsDir = path.resolve(__dirname, 'contracts');
const buildDir = path.resolve(__dirname, 'build');

const contractPath = path.resolve(contractsDir, contractFile);
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        [contractFile]: {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode.object'] // Specify what to output
            }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for compilation errors
if (output.errors) {
    output.errors.forEach(err => {
        if (err.severity === 'error') {
            console.error(err.formattedMessage);
        }
    });
}

// Ensure the build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Process output for each contract
for (let contractName in output.contracts[contractFile]) {
    const contract = output.contracts[contractFile][contractName];
    console.log('Contract:', contractName);

    // Save ABI and bytecode to the build folder
    const abiPath = path.resolve(buildDir, `${contractName}.abi`);
    const bytecodePath = path.resolve(buildDir, `${contractName}.bin`);

    fs.writeFileSync(abiPath, JSON.stringify(contract.abi, null, 2), 'utf8');
    console.log('ABI saved to', abiPath);

    fs.writeFileSync(bytecodePath, contract.evm.bytecode.object, 'utf8');
    console.log('Bytecode saved to', bytecodePath);
}