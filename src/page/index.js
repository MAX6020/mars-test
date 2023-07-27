const input = document.getElementById('file')
const btn = document.getElementById('btn__open')

const triggerInput = () => input.click()

btn.addEventListener('click', triggerInput)