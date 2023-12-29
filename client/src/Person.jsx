import Avatar from "./Avatar";

export default function Contact({id, username, onClick, selected,online}) {
    return (
    <div key={id} onClick ={() => onClick(id)} 
        className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer text-lg " + (selected ? 'bg-blue-50' : '')}>
       
       {selected && (
           <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
       )}
       <div className="flex gap-2 py-2 pl-4 items-center">  
       <Avatar online={online} username = {username} userId={id} className="w-10 h-10" />
       <span>{username}</span>
       </div>
    </div>
   // i am trying to get a green dot around the user who is online
    );
}