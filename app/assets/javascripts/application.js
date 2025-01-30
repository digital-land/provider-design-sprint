//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
  function toggleComplete(button) {
    // find tag within parent element
    const tag = button.closest('.govuk-task-list__item').querySelector('.govuk-task-list__status>strong')
    const classes = tag.classList;
    if (tag.textContent.trim() == "Incomplete") {
      tag.textContent = "Completed"
      button.textContent = "Mark this step as incomplete"
      classes.replace("govuk-tag--grey", "govuk-tag--blue")
    } else {
      tag.textContent = "Incomplete"
      button.textContent = "Mark this step as complete"
      classes.replace("govuk-tag--blue", "govuk-tag--grey")
    }
  }

  const markCompletedButtons = document.querySelectorAll('.js-mark-completed');
  markCompletedButtons.forEach(button => {
    button.addEventListener("click", () => {
      console.log('click')
      toggleComplete(button)
    },
    false
    )
  })
})
