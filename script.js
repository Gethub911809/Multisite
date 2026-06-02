function openPage(pageName) {
  // Hide all elements with class="tabcontent" by default
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Remove the background color of all tablinks/buttons
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }

  var page = document.getElementById(pageName);
  if (page) {
    page.style.display = "block";
  }
}

// If the page has a defaultOpen tab, click it.
var defaultOpen = document.getElementById("defaultOpen");
if (defaultOpen) {
  defaultOpen.click();
}
