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

  export const getISOWeekNumber = (date = new Date()) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Make Sunday (0) into 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };