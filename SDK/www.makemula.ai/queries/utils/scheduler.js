const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('./query-runner');

/**
 * Scheduler class for managing cron jobs
 */
class QueryScheduler {
    constructor() {
        this.jobs = new Map();
        this.schedulesPath = path.join(__dirname, '..', 'schedules');
    }

    /**
     * Loads schedule configurations from files
     * @returns {Array} - Array of schedule configurations
     */
    async loadSchedules() {
        try {
            const files = await fs.readdir(this.schedulesPath);
            const schedules = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const schedulePath = path.join(this.schedulesPath, file);
                    const scheduleData = await fs.readFile(schedulePath, 'utf8');
                    const schedule = JSON.parse(scheduleData);
                    schedules.push(schedule);
                }
            }
            
            return schedules;
        } catch (error) {
            console.error('Error loading schedules:', error);
            return [];
        }
    }

    /**
     * Starts a scheduled job
     * @param {Object} schedule - Schedule configuration
     * @param {string} schedule.name - Name of the schedule
     * @param {string} schedule.cron - Cron expression
     * @param {string} schedule.query - Query name to execute
     * @param {Object} schedule.parameters - Query parameters
     * @param {string} schedule.output_location - Output location
     */
    startJob(schedule) {
        const { name, cron: cronExpression, query, parameters = {}, output_location } = schedule;
        
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression for schedule ${name}: ${cronExpression}`);
        }
        
        const job = cron.schedule(cronExpression, async () => {
            try {
                console.log(`Executing scheduled query: ${query} (schedule: ${name})`);
                
                const result = await executeQuery(query, {
                    parameters,
                    output_location
                });
                
                console.log(`Scheduled query completed: ${query} (schedule: ${name})`);
                console.log(`Result: ${JSON.stringify(result, null, 2)}`);
                
            } catch (error) {
                console.error(`Error executing scheduled query ${query} (schedule: ${name}):`, error);
                
                // TODO: Add error notification (Slack, email, etc.)
                // await notifyError(schedule, error);
            }
        }, {
            scheduled: false // Don't start immediately
        });
        
        this.jobs.set(name, job);
        job.start();
        
        console.log(`Started scheduled job: ${name} (${cronExpression})`);
    }

    /**
     * Stops a scheduled job
     * @param {string} name - Name of the schedule to stop
     */
    stopJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            this.jobs.delete(name);
            console.log(`Stopped scheduled job: ${name}`);
        } else {
            console.warn(`No scheduled job found with name: ${name}`);
        }
    }

    /**
     * Starts all scheduled jobs
     */
    async startAll() {
        try {
            const schedules = await this.loadSchedules();
            
            for (const schedule of schedules) {
                this.startJob(schedule);
            }
            
            console.log(`Started ${schedules.length} scheduled jobs`);
        } catch (error) {
            console.error('Error starting scheduled jobs:', error);
        }
    }

    /**
     * Stops all scheduled jobs
     */
    stopAll() {
        for (const [name, job] of this.jobs) {
            job.stop();
        }
        
        this.jobs.clear();
        console.log('Stopped all scheduled jobs');
    }

    /**
     * Lists all active scheduled jobs
     * @returns {Array} - Array of active job information
     */
    listJobs() {
        const jobList = [];
        
        for (const [name, job] of this.jobs) {
            jobList.push({
                name,
                running: job.running,
                nextRun: job.nextDate().toISOString()
            });
        }
        
        return jobList;
    }

    /**
     * Creates a new schedule configuration
     * @param {Object} schedule - Schedule configuration
     * @param {string} schedule.name - Name of the schedule
     * @param {string} schedule.cron - Cron expression
     * @param {string} schedule.query - Query name to execute
     * @param {Object} schedule.parameters - Query parameters
     * @param {string} schedule.output_location - Output location
     */
    async createSchedule(schedule) {
        const { name, cron: cronExpression, query, parameters = {}, output_location } = schedule;
        
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }
        
        const scheduleData = {
            name,
            cron: cronExpression,
            query,
            parameters,
            output_location: output_location || 's3://prod.makemula.ai/athena-results/',
            created_at: new Date().toISOString(),
            description: schedule.description || ''
        };
        
        const schedulePath = path.join(this.schedulesPath, `${name}.json`);
        await fs.writeFile(schedulePath, JSON.stringify(scheduleData, null, 2));
        
        console.log(`Created schedule: ${name}`);
        return scheduleData;
    }

    /**
     * Deletes a schedule configuration
     * @param {string} name - Name of the schedule to delete
     */
    async deleteSchedule(name) {
        // Stop the job if it's running
        this.stopJob(name);
        
        // Delete the schedule file
        const schedulePath = path.join(this.schedulesPath, `${name}.json`);
        await fs.unlink(schedulePath);
        
        console.log(`Deleted schedule: ${name}`);
    }

    /**
     * Runs a query immediately (for testing)
     * @param {string} queryName - Name of the query to run
     * @param {Object} options - Query options
     */
    async runQueryNow(queryName, options = {}) {
        try {
            console.log(`Running query immediately: ${queryName}`);
            
            const result = await executeQuery(queryName, options);
            
            console.log(`Query completed: ${queryName}`);
            console.log(`Result: ${JSON.stringify(result, null, 2)}`);
            
            return result;
        } catch (error) {
            console.error(`Error running query ${queryName}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
const scheduler = new QueryScheduler();

module.exports = scheduler; 