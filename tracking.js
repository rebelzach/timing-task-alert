var osa = require('osa2');
var fs = require("fs");

module.exports = {
    checkTaskStatusAsync: function () {
        var taskListPath = "~/task-monitor/export-output/daily-export.json";
        return osa((taskListPath) => {
            var startDate = new Date();
            startDate.setHours(0,0,0,0);
            var endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1 /* days */);

            var helper = Application("TimingHelper");
            if (!helper.scriptingSupportAvailable()) { 
                throw "No scripting support"; 
            }

            var reportSettings = helper.ReportSettings().make();
            var exportSettings = helper.ExportSettings().make();

            reportSettings.firstGroupingMode = "raw";
            reportSettings.tasksIncluded = true;
            reportSettings.appUsageIncluded = false;

            exportSettings.fileFormat = "JSON";
            exportSettings.durationFormat = "seconds";
            exportSettings.shortEntriesIncluded = true;

            helper.saveReport({ 
                withReportSettings: reportSettings, 
                exportSettings: exportSettings, 
                between: startDate, 
                and: endDate, 
                to: Path($(taskListPath).stringByStandardizingPath.js) 
            });

            helper.delete(reportSettings);
            helper.delete(exportSettings);
        })(taskListPath).then(function (result) {
            var content = fs.readFileSync("export-output/daily-export.json");
            var tasks = JSON.parse(content);
            console.log(tasks);
            var now = new Date((new Date()) - 65000); // Must look back at least a minute
            console.log(now);
            var isTaskRunning = 
                tasks
                    .map(t => ({end: new Date(t.endDate) }))
                    .some(t => t.end > now);

            return isTaskRunning
        });
    }
}

