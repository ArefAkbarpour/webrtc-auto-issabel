// Get references to the call button and drawer
const callButton = document.getElementById('callButton');
const callDrawer = document.getElementById('callDrawer');

// Add event listener to the call button
callButton.addEventListener('click', () => {
    // Toggle the 'show' class on the drawer to control its visibility
    callDrawer.classList.toggle('show');
});

// Optional: Close the drawer if the user clicks outside of it
document.addEventListener('click', (event) => {
    if (!callButton.contains(event.target) && !callDrawer.contains(event.target)) {
        if (callDrawer.classList.contains('show')) { // Only close if it's open
            callDrawer.classList.remove('show');
        }
    }
});
