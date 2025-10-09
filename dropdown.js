let dropDownButton = document.querySelector(".dropDownButton");
let sliderContainer = document.querySelector(".sliderDropDownContainer");

dropDownButton.addEventListener("click", () => {
  sliderContainer.classList.toggle("active");
});
