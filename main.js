let huejay = require('huejay');
let tasks = require('./tracking');
let inquirer = require('inquirer');

inquirer
  .prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What do you want to do?',
      choices: [
        { name: 'Start task monitor', value: 'monitorTasks'},
        { name: 'List all lights', value: 'listLights'},
        { name: 'Be done', value: 'done'},
        new inquirer.Separator(),
      ]
    },
  ])
  .then(answer => {
    switch (answer.operation) {
      case 'listLights':
        printAllLights();
        break;
      case 'monitorTasks':
        inquirer
          .prompt([
            {
              type: 'list',
              name: 'color',
              message: 'What color would you like as your default?',
              choices: [
                { name: 'White', value: 'white'},
                { name: 'Off', value: 'off'},
              ]
            },
          ])
          .then(answer => {
            switch (answer.color) {
              case 'white':
                startTaskMonitor();
                break;
              case 'off':
                startTaskMonitor({ hue:0, brightness:0, saturation:0 });
                break;
              default:
                break;
            }
          });
        break;
      default:
        break;
    }
  });

function discoverBridges() {
    huejay.discover()
        .then(bridges => {
            for (let bridge of bridges) {
                console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
            }
        })
        .catch(error => {
            console.log(`An error occurred: ${error.message}`);
        });
}


function getDefaultClient() {
    let client = new huejay.Client({
      host:     '192.168.1.40',
      username: '9vRJKIG46uOosAR5-tNe11KYca4N1GNJ4Qz6BUE0', // Optional
    });
    return client
}

function createBridgeUser() {
    let client = getDefaultClient();
    let user = new client.users.User;
     
    // Optionally configure a device type / agent on the user
    user.deviceType = 'zach_development_device'; // Default is 'huejay'
     
    client.users.create(user)
        .then(user => {
            console.log(`New user created - Username: ${user.username}`);
        })
        .catch(error => {
            if (error instanceof huejay.Error && error.type === 101) {
              return console.log(`Link button not pressed. Try again...`);
            }

            console.log(error.stack);
        });
}

function printAllLights() {
    let client = getDefaultClient();
    client.lights.getAll()
      .then(lights => {
        for (let light of lights) {
          console.log(`Light [${light.id}]: ${light.name}`);
          console.log(`  Type:             ${light.type}`);
          console.log(`  Unique ID:        ${light.uniqueId}`);
          console.log(`  Manufacturer:     ${light.manufacturer}`);
          console.log(`  Model Id:         ${light.modelId}`);
          console.log('  Model:');
          console.log(`    Id:             ${light.model.id}`);
          console.log(`    Manufacturer:   ${light.model.manufacturer}`);
          console.log(`    Name:           ${light.model.name}`);
          console.log(`    Type:           ${light.model.type}`);
          console.log(`    Color Gamut:    ${light.model.colorGamut}`);
          console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
          console.log(`  Software Version: ${light.softwareVersion}`);
          console.log('  State:');
          console.log(`    On:         ${light.on}`);
          console.log(`    Reachable:  ${light.reachable}`);
          console.log(`    Brightness: ${light.brightness}`);
          console.log(`    Color mode: ${light.colorMode}`);
          console.log(`    Hue:        ${light.hue}`);
          console.log(`    Saturation: ${light.saturation}`);
          console.log(`    Color Temp: ${light.colorTemp}`);
          console.log(`    Alert:      ${light.alert}`);
          console.log(`    Effect:     ${light.effect}`);
          console.log();
        }
      });
}


function startTaskMonitor(defaults) {
    let client = getDefaultClient();
    var checkIntervalSeconds = 10;

    setInterval(function () {
        console.log("checking");
        tasks.checkTaskStatusAsync()
            .then(function (status) {
                console.log(status);
                var defaults = defaults || {
                    hue: 14988,
                    saturation: 141,
                    brightness: 254
                };
                var hue = defaults.hue;
                var saturation = defaults.saturation;
                var brightness = defaults.brightness;
                var alert = false;
                if (status === "not-running") {
                    hue = 0;
                    saturation = 254;
                    brightness = 254;
                    alert = true;
                } else if (status === "long-running") {
                    hue = 42475;
                    saturation = 254;
                    brightness = 254;
                    alert = true;
                } 
                client.lights.getById(2)
                  .then(light => {
                    light.on = true;
                    light.brightness = brightness;
                    light.hue        = hue;
                    light.saturation = saturation;
                    if (alert)
                        light.alert = "lselect";
                    else
                        light.alert = "none";
                 
                    return client.lights.save(light);
                  })
                  .then(light => {
                    console.log(`Updated light [${light.id}]`);
                  });
            });
    }, checkIntervalSeconds * 1000);
}
