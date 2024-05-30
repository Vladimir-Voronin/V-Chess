class RightMenuBind {
    constructor(element, container_element) {
        this.button_element = element;
        this.container_element = container_element;
        this.is_active = false;
    }

    make_not_active() {
        this.button_element.classList.remove("active");
        this.container_element.style.visibility = "hidden";
        this.is_active = false;
    }

    make_active() {
        this.button_element.classList.add("active");
        this.container_element.style.visibility = "visible";
        this.is_active = true;
    }
}

class RightMenuView {
    constructor(bind_list) {
        this.all_binds = bind_list;
        this.all_binds.forEach(value => {
            value.button_element.addEventListener('click', (function (e) {
                this.on_button_click(value);
            }).bind(this))
        });
        if (this.all_binds)
            this.on_button_click(this.all_binds[0]);
    }

    on_button_click(bind_obj) {
        this.all_binds.forEach(value => {
            value.make_not_active();
        })
        bind_obj.make_active();
    }
}