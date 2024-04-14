MT.autoStow = () => {
  if (document.body.offsetWidth <= 768) {
    UIBar.stow();
  }
};

$("#ui-bar-body").append(`
  <div id="ui-bar-footer">
    <span>
      <a class="footer-element" target="_blank" rel="noreferrer"
        href="https://www.patreon.com/sleth"
        ><img alt="Patreon" src="images/pa_logo.png" height="30"></a>

      <a class="footer-element" target="_blank" rel="noreferrer"
        href="https://twitter.com/slethwulf"
        ><img alt="Twitter" src="images/tw_logo.png" height="30"></a>

      <a class="footer-element" target="_blank" rel="noreferrer"
        href="https://www.furaffinity.net/user/sleth/"
        ><img alt="FurAffinity" src="images/fa_logo.png" height="30"></a>

      <a class="footer-element" target="_blank" rel="noreferrer"
        href="https://sleth.sofurry.com/"
        ><img alt="SoFurry" src="images/sf_logo.png" height="30"></a>
    </span>
  </div>
`);

Config.ui.stowBarInitially = !session.get("show-sidebar");

$(document).on(":passagestart", () => {
  $("#ui-bar-toggle").on("click", () => {
    setTimeout(() => {
      session.set("show-sidebar", !UIBar.isStowed());
    });
  });
});
