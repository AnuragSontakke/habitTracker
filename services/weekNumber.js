export const getWeekNumber=(date = new Date())=>{
    // Get the first day of the year
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    
    // Calculate the number of milliseconds since the start of the year
    const diff = date - startOfYear;
  
    // Convert the difference to days
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
    // Calculate the week number
    const weekNumber = Math.ceil(dayOfYear / 7);
  
    return weekNumber;
  }

