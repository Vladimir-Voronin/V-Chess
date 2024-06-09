class TimeControlView {
    constructor(all_time_controls, default_time_control = null) {
        if (all_time_controls.length == 0) {
            throw new Error("TimeControlView work only with non empty time control list");
        }
        this.all_time_controls = all_time_controls;

        this.all_time_controls.forEach(value => {
            value.element.addEventListener('click', (function (e) {
                this.on_button_click(value);
            }).bind(this))
        });

        if (default_time_control) {
            this.on_button_click(default_time_control)
        }
        else {
            this.on_button_click(this.all_time_controls[0])
        }
    }

    on_button_click(timecontrol) {
        this.all_time_controls.forEach(value => {
            value.make_not_active();
        });
        timecontrol.make_active();
        this.choosed_time_control = timecontrol;
    }
}

class SearchMatchSubscriber {
    constructor() {
        this.is_subscribed = false;
    }

    subscribe() {

    }

    unsubscribe() {

    }
}

function TimeControl(full_time, additional_time, element) {
    this.full_time = full_time;
    this.additional_time = additional_time;
    this.element = element;
    this.is_active = false;

    this.make_active = function () {
        this.element.classList.add("active");
        this.is_active = true;
    }

    this.make_not_active = function () {
        this.element.classList.remove("active");
        this.is_active = false;
    }
}

const timecontrol_3 = new TimeControl(180, null,
    document.querySelector("#timecontrol_3"));
const timecontrol_3_2 = new TimeControl(180, 2,
    document.querySelector("#timecontrol_3_2"));
const timecontrol_15 = new TimeControl(900, null,
    document.querySelector("#timecontrol_15"));

const all_timecontrols = [timecontrol_3, timecontrol_3_2, timecontrol_15];
const time_control_view = new TimeControlView(all_timecontrols);

const play_button = document.querySelector("#play_button");
const cancel_button = document.querySelector("#cancel_button");

play_button.addEventListener("click", (e) => {
    on_play_button_click(e, time_control_view, play_button, cancel_button)
});
cancel_button.addEventListener("click", (e) => {
    on_cancel_button_click(e, play_button, cancel_button)
});

function on_play_button_click(e, timecontrol_view, play_button, cancel_button) {
    const active_timecontrol = time_control_view.all_time_controls.find((elem) => elem.is_active);
    console.log(active_timecontrol);
    const data = {
        "full_time": active_timecontrol.full_time,
        "additional_time": active_timecontrol.additional_time,
    };
    console.log(data);
    const data_json = JSON.stringify(data);
    console.log(data_json);
    $.ajax({
        data: data_json,
        type: "GET",
        url: url_ajax_start_search,
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.log(response);
        },
        error: function (response) {
            console.log("error");
        }
    });
    play_button.style.display = "none";
    cancel_button.style.display = "flex";
}

function on_cancel_button_click(e, play_button, cancel_button) {
    $.ajax({
        type: "GET",
        url: url_ajax_cancel_search,
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.log(response);
        },
        error: function (response) {
            console.log("error");
        }
    });
    cancel_button.style.display = "none";
    play_button.style.display = "flex";
}