export class BodyTooLarge extends Error {}
export async function readBoundedBody(request:Pick<Request,'headers'|'body'>,maxBytes:number):Promise<string>{
 if(Number(request.headers.get('content-length')||0)>maxBytes)throw new BodyTooLarge();
 const reader=request.body?.getReader();if(!reader)return '';
 const parts:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new BodyTooLarge();}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return new TextDecoder().decode(bytes);
}
