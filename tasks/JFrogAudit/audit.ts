import * as utils from '@jfrog/tasks-utils';
import * as tl from 'azure-pipelines-task-lib/task';

const cliAuditCommand: string = 'audit';
let serverId: string;

function RunTaskCbk(cliPath: string): void {
    const inputWorkingDirectory: string = tl.getInput('workingDirectory', false) || '';
    const defaultWorkDir: string = tl.getVariable('System.DefaultWorkingDirectory') || process.cwd();
    const sourcePath: string = utils.determineCliWorkDir(defaultWorkDir, inputWorkingDirectory);

    serverId = utils.configureDefaultXrayServer('xray_audit', cliPath, defaultWorkDir);

    let auditCommand: string = utils.cliJoin(cliPath, cliAuditCommand);
    auditCommand = utils.addServerIdOption(auditCommand, serverId);
    auditCommand = utils.addBoolParam(auditCommand, 'allowFailBuild', 'fail');

    // Add watches source if provided.
    const watchesSource: string = tl.getInput('watchesSource', false) || '';
    if (watchesSource !== 'none') {
        auditCommand = utils.addStringParam(auditCommand, watchesSource, watchesSource, true);
    }
    executeCliCommand(auditCommand, sourcePath, cliPath);
}

function executeCliCommand(cliCmd: string, buildDir: string, cliPath: string): void {
    try {
        utils.executeCliCommand(cliCmd, buildDir);
        tl.setResult(tl.TaskResult.Succeeded, 'Build Succeeded.');
    } catch (ex) {
        tl.setResult(tl.TaskResult.Failed, ex as string);
    } finally {
        utils.deleteCliServers(cliPath, buildDir, [serverId]);
    }
}

utils.executeCliTask(RunTaskCbk);