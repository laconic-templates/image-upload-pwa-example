import React from "react";

import Login from "./Login";
import ImageList from "./ImageList";
import { useAccounts } from "../hooks";

const App: React.FC = () => {
	const { isLoggedIn, logout } = useAccounts();

	return (
		<div className="flex flex-col h-full">
			{/* Top Navigation Bar */}
			<div className="p-4 shadow-md fixed top-0 left-0 right-0 bg-white z-10">
				<h1 className="text-center text-xl font-bold">Image App</h1>
				{isLoggedIn && (
					<button
						className="absolute top-4 right-4"
						onClick={() => {
							logout();
						}}
					>
						Logout
					</button>
				)}
			</div>

			{/* Main Content */}
			{isLoggedIn ? <ImageList /> : <Login />}
		</div>
	);
};

export default App;
