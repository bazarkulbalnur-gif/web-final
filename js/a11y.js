'use strict';

const FONT_KEY = 'wanderlens:font-size';
const FONT_STEPS = [85, 100, 115, 130, 150];

class TextSizeControl {
    constructor() {
        this.store = new JsonStore(FONT_KEY, 100);
        const saved = this.store.read();
        this.percent = FONT_STEPS.includes(saved) ? saved : 100;
        this.apply();
    }

    apply() {
        document.documentElement.style.fontSize = this.percent + '%';
        this.store.write(this.percent);
        if (this.smaller) { this.smaller.disabled = this.percent === FONT_STEPS[0]; }
        if (this.larger) { this.larger.disabled = this.percent === FONT_STEPS[FONT_STEPS.length - 1]; }
        if (this.label) { this.label.textContent = 'Text size ' + this.percent + '%'; }
    }

    change(direction) {
        const index = FONT_STEPS.indexOf(this.percent) + direction;
        if (index < 0 || index >= FONT_STEPS.length) { return; }
        this.percent = FONT_STEPS[index];
        this.apply();
    }

    mount() {
        const actions = document.querySelector('.wl-actions');
        if (!actions) { return; }
        const self = this;
        this.smaller = this.createButton('A\u2212', 'Decrease text size', function () { self.change(-1); });
        this.larger = this.createButton('A+', 'Increase text size', function () { self.change(1); });
        this.label = createEl('span', 'visually-hidden');
        this.label.setAttribute('role', 'status');
        actions.prepend(this.label, this.smaller, this.larger);
        this.apply();
    }

    createButton(text, ariaLabel, onClick) {
        const btn = createEl('button', 'icon-btn text-size-btn', text);
        btn.type = 'button';
        btn.setAttribute('aria-label', ariaLabel);
        btn.addEventListener('click', onClick);
        return btn;
    }
}

const textSizeControl = new TextSizeControl();
document.addEventListener('DOMContentLoaded', function () { textSizeControl.mount(); });
