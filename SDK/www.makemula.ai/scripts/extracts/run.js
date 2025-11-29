require('dotenv').config();
const AthenaUtils = require("../../helpers/AthenaUtils.js");

const args = process.argv.slice(2);

function getParamValue(args, param) {
    for (let i = 0; i < args.length; i++) {
        if (args[i] === `--${param}` && i + 1 < args.length) {
            return args[i + 1];
        }
    }
    return null;
}

const source = getParamValue(args, 'source');
const extract = getParamValue(args, 'extract');

const run = (source, extract) => {
    switch(source) {
    case "athena":
        const queries = require("./athena/index.js");
        queries.forEach((query) => {
            if(!extract || query.name === extract) {
                AthenaUtils.executeNamedQuery(query.id, `s3://prod.makemula.ai/athena-results/${query.name}`);    
            }
        });
        break;
    default:
        throw new Error(`unknown extract ${extract}`);
    }
};

run(source, extract);




