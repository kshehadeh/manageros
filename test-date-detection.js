const chrono = require('chrono-node');

// Test the date detection logic
function testDateDetection() {
  console.log('Testing tomorrow detection:');
  const tomorrowResult = chrono.parse('Complete the report tomorrow');
  console.log('Tomorrow result:', tomorrowResult);
  if (tomorrowResult[0]) {
    const dateObj = tomorrowResult[0].start.date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    console.log('Local date string:', localDateString);
    
    // Format with time
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    const formatted = dateObj.toLocaleDateString('en-US', options);
    console.log('Formatted date:', formatted);
  }

  console.log('\nTesting today detection:');
  const todayResult = chrono.parse('Finish this task today');
  console.log('Today result:', todayResult);
  if (todayResult[0]) {
    const dateObj = todayResult[0].start.date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    console.log('Local date string:', localDateString);
    
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    const formatted = dateObj.toLocaleDateString('en-US', options);
    console.log('Formatted date:', formatted);
  }
}

testDateDetection();
