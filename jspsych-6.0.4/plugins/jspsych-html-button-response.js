/**
 * jspsych-html-button-response
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["html-button-response"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'html-button-response',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The HTML string to be displayed'
      },
      choices: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Choices',
        default: undefined,
        array: true,
        description: 'The labels for the buttons.'
      },
      button_html: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button HTML',
        default: '<button class="jspsych-btn">%choice%</button>',
        array: true,
        description: 'The html of the button. Can create own style.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed under the button.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show the trial.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, then trial will end when user responds.'
      },
    }
  }

  time_elapsed = performance.now();

  plugin.trial = function(display_element, trial) {

    // display stimulus
    var html = '<div id="jspsych-html-button-response-stimulus">'+trial.stimulus+'</div>';

    //display buttons
    var buttons = [];
    if (Array.isArray(trial.button_html)) {
      if (trial.button_html.length == trial.choices.length) {
        buttons = trial.button_html;
      } else {
        console.error('Error in html-button-response plugin. The length of the button_html array does not equal the length of the choices array');
      }
    } else {
      for (var i = 0; i < trial.choices.length; i++) {
        buttons.push(trial.button_html);
      }
    }
    html += '<div id="jspsych-html-button-response-btngroup">';
    for (var i = 0; i < trial.choices.length; i++) {
      var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
      html += '<div class="jspsych-html-button-response-button" style="display: inline-block; " id="jspsych-html-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
    }
    html += '</div>';

    //show prompt if there is one
    if (trial.prompt !== null) {
      html += trial.prompt;
    }
    display_element.innerHTML = html;

    // start time
    start_time = performance.now();

    // create flashes as css elements to be called later in the functions flash_Off and flash_On
    const flashup = document.createElement("flash");
    flashup.classList.add("flashup");
    document.body.appendChild(flashup);

    const flashdown = document.createElement("flash");
    flashdown.classList.add("flashdown");
    document.body.appendChild(flashdown);

    // creating arrays to save data for order of buttons pressed, time for flashon and time for flashoff
    choicebutton = [];
    choicetime = [];
    flashOn = [];
    flashontime = [];
    flashOff = [];
    flashofftime = [];
    // creating counter to condition flash, so that it doesn't show for the last button pressed in the trial
    count = 0;

    // add event listeners to buttons
    for (var i = 0; i < trial.choices.length; i++) {
      display_element.querySelector('#jspsych-html-button-response-button-' + i).addEventListener('touchstart', function(e){
        choice = e.currentTarget.getAttribute('data-choice'); // sets label to button pressed

        if (e.target.nodeName === 'BUTTON') {       
            count +=1;
            choicebutton.push(choice); // saves which button was pressed and at what time
            timertrial = performance.now(); // saves the time of when a button is pressed
            choicetime.push(timertrial);
            e.target.classList.toggle('hidden'); // hides the button pressed
            if (count < 6){
                function flash_On(){    
                    var colors = ['#ffffff', '#808080']; 
                    random_color = colors[Math.floor(Math.random() * colors.length)];
                    flashup.style.backgroundColor = random_color; // sets the color of the flash to a random color
                    flashdown.style.backgroundColor = random_color;  

                    flashOnTimer = performance.now();
                    flashontime.push(flashOnTimer); 
                    flashOn.push(flashup.style.backgroundColor); // saves the color of the flash (flash/no flash) and the time of the flash appearance
                    setTimeout(flash_Off, 60)
                }
                setTimeout(flash_On, 80);

                function flash_Off(){
                    flashup.style.backgroundColor="#808080";
                    flashdown.style.backgroundColor="#808080";
                    flashOffTimer = performance.now();
                    flashofftime.push(flashOffTimer);
                    flashOff.push(flashup.style.backgroundColor); // saves when the flash disappears
                }
            }

            if (!document.querySelector('button:not(.hidden)')) {            
                function endTrial(){                        
                    end_trial();
                    flashup.style.display="none";
                    flashdown.style.display="none";
                };
                setTimeout(endTrial, 20);
            }
        }
      })
    };


        // store response
    var response = {
      rt: null,
      button: null
    };
    //var choice = display_element.querySelector('#jspsych-html-button-response-button-' + i);
    // function to handle responses by the subject
    function after_response(choice) {
        
        // measure rt
     // var end_time = performance.now();
     // var rt = end_time - start_time;
     // response.button = parseInt(choice);
     // response.rt = rt;
        // after a valid response, the stimulus will have the CSS class 'responded'
        // which can be used to provide visual feedback that a response was recorded
        display_element.querySelector('#jspsych-html-button-response-stimulus').className += ' responded';
    };       

    // function to end trial when it is time
    function end_trial() {
      end_time = performance.now();
      rt = end_time - start_time;
      response.button = parseInt(choice);
      response.rt = rt;
      screenWidth = screen.width;
      screenHeight = screen.height;

        // kill any remaining setTimeout handlers
        jsPsych.pluginAPI.clearAllTimeouts();

        // gather the data to store for the trial
        var trial_data = {
          "screenWidth": screenWidth,
          "screenHeight": screenHeight,
          "time_elapsed": time_elapsed,
          "rt": rt,
          "flashon":flashOn,
          "flashontime": flashontime,
          "flashoff":flashOff,
          "flashofftime": flashofftime,
          "choice": choicebutton,
          "choicetime":choicetime,
        };
      
        // clear the display
        display_element.innerHTML = '';

        // move on to the next trial
        jsPsych.finishTrial(trial_data);
    };

    // hide image if timing is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#jspsych-html-button-response-stimulus').style.visibility = 'hidden';
      }, trial.stimulus_duration);
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    };
  };
  return plugin;
})();
