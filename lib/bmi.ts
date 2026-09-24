// Adult screening categories: CDC. Classify before rounding for display.
export function bmiCategory(bmi:number){return bmi<18.5?'Underweight':bmi<25?'Healthy-weight range':bmi<30?'Overweight':'Obesity range';}
export function bmiFor(heightCm:number,weightKg:number){if(!Number.isFinite(heightCm)||!Number.isFinite(weightKg)||heightCm<=0||weightKg<=0)return null;return weightKg/(heightCm/100)**2;}
export function bmiReference(heightCm:number){if(!Number.isFinite(heightCm)||heightCm<=0)return null;const square=(heightCm/100)**2;return {lower:18.5*square,upperExclusive:25*square};}
