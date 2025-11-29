require('dotenv').config();
const transformLoadJobs = require("./index.js");

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

const run = async (source, extract) => {
    const jobs = transformLoadJobs[source];
    if(!jobs)
        throw new Error(`no jobs for ${source}`);
    for(let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if(!extract || job.name === extract) {
            console.log(`running job ${job.name} from ${source}`);
            await job.run();
        }
    }
};

run(source, extract);
