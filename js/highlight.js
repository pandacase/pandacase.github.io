// onload:
document.body.classList.add("line-numbers","match-braces");
Prism.plugins.toolbar.registerButton("select-code", function (env) {
let button = document.createElement("button");
button.textContent = "select this " + env.language;
button.addEventListener("click", function () {
    if (document.body.createTextRange) {
    let range = document.body.createTextRange();
    range.moveToElementText(env.element);
    range.select();
    } else if (window.getSelection) {
    let selection = window.getSelection();
    let range = document.createRange();
    range.selectNodeContents(env.element);
    selection.removeAllRanges();
    selection.addRange(range);
    }


});
return button;
})