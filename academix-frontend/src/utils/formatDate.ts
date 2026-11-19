//for date in format DD.MM.YYYY
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.getDate().toString().padStart(2, '0') + '.' + 
                         (date.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                         date.getFullYear();
    return formattedDate;
}

//for date in format HH:MM
export   const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };