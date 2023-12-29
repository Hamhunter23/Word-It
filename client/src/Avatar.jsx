export default function Avatar({userId,username,online}) {
    const colors = ['bg-indigo-200','bg-pink-200','bg-purple-200','bg-red-200','bg-green-200','bg-blue-200','bg-yellow-200'];
    const userIdBase10 = parseInt(userId,16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    return(
        <div className={"w-12 h-12 relative rounded-full flex text-center items-center justify-center "+color}>
            {username && username[0].toUpperCase()}
        {online && (
            <div className="absolute w-4 h-4 bg-green-500 rounded-full bottom-0 right-0 border border-white"></div>
        )}
        {!online && (
            <div className="absolute w-4 h-4 bg-red-500 rounded-full bottom-0 right-0 border border-white"></div>
        )}
        </div>
    );
}