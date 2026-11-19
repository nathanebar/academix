export async function getAudioDurationFromFile(file: File): Promise<number> {

  // console.log(file);
  
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    //   URL.revokeObjectURL(url);
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio'));
    //   URL.revokeObjectURL(url);
    };
  });
}