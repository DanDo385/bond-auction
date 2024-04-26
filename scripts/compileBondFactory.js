// scripts/compileBondFactory.js
const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractFile = 'BondAuctionFactory.sol';
const contractsDir = path.resolve(__dirname, '..', 'contracts');
const buildDir = path.resolve(__dirname, '..', 'build');

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
                '*': ['abi', 'evm.bytecode.object']
            }
        }
    }
};

let output;
try {
    output = JSON.parse(solc.compile(JSON.stringify(input)));
} catch (err) {
    console.error('Compilation error:', err);
    return;
}

if (output.errors) {
    output.errors.forEach(err => {
        console.error(err.formattedMessage);
        if (err.severity === 'error') {
            throw new Error('Stopping the compilation due to Solidity errors.');
        }
    });
}

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

if (output.contracts) {
    for (let contractName in output.contracts[contractFile]) {
        const contract = output.contracts[contractFile][contractName];
        console.log('Contract:', contractName);

        const abiPath = path.resolve(buildDir, `${contractName}.abi`);
        const bytecodePath = path.resolve(buildDir, `${contractName}.bin`);

        fs.writeFileSync(abiPath, JSON.stringify(contract.abi, null, 2), 'utf8');
        console.log('ABI saved to', abiPath);

        fs.writeFileSync(bytecodePath, contract.evm.bytecode.object, 'utf8');
        console.log('Bytecode saved to', bytecodePath);
    }
} else {
    console.error('No output from compilation');
}
