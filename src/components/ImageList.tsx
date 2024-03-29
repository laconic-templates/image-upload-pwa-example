import React, { useState, useEffect, useRef } from "react";

import UploadPreviewModal from "./UploadPreviewModal";
import UploadButton from "./UploadButton";
import EmptyState from "./EmptyState";
import ImageCard from "./ImageCard";
import { ImageRecord } from "../types";
import { useAccounts, useEncryption, useImageStorage } from "../hooks";
import { AccessControlConditions } from "@lit-protocol/types";

const accessControlConditions: AccessControlConditions = [
	{
		contractAddress: "",
		standardContractType: "",
		chain: "ethereum",
		method: "eth_getBalance",
		parameters: [":userAddress", "latest"],
		returnValueTest: {
			comparator: ">=",
			value: "0", // 0 ETH, so anyone can open
		},
	},
];

const ImageList: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [images, setImages] = useState<ImageRecord[]>([]);
	const [preview, setPreview] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { storeImage, fetchImages, isLoading } = useImageStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const accountHook = useAccounts();
	const { encrypt, decrypt } = useEncryption();

	useEffect(() => {
		if (!isLoading) {
			fetchImages().then(setImages);
		}
	}, [isLoading]);

	useEffect(() => {
		if (!selectedFile) {
			setPreview(null);
			return;
		}

		const objectUrl = URL.createObjectURL(selectedFile);
		setPreview(objectUrl);
		setIsModalOpen(true);

		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [selectedFile]);

	const resetFormAndCloseModal = () => {
		setSelectedFile(null);
		setIsModalOpen(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files ? e.target.files[0] : null;
		setSelectedFile(file);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const uploadImage = async (title?: string, _description?: string) => {
		if (selectedFile) {
			const encrypted = await encrypt({
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				provider: accountHook.provider!,
				pkp: accountHook.pkp ?? "",
				dataToEncrypt: "",
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				authMethod: accountHook.authMethod!,
				accessControlConditions: accessControlConditions,
			});
			await storeImage(selectedFile, title, JSON.stringify(encrypted));
			const updatedImages = await fetchImages();
			setImages(updatedImages);
			resetFormAndCloseModal();
		}
	};

	return (
		<div>
			<div className="flex-grow p-5 overflow-y-auto mt-12 mb-8">
				<div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
					{images.length === 0 ? (
						<EmptyState />
					) : (
						images.map((image, index) => (
							<ImageCard
								key={index}
								image={image}
								index={index}
								decrypt={async () => {
									return await decrypt({
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
										provider: accountHook.provider!,
										pkp: accountHook.pkp ?? "",
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
										dataToDecryptHash: image.title!,
										ciphertext: "",
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
										authMethod: accountHook.authMethod!,
										accessControlConditions: accessControlConditions,
									});
								}}
							/>
						))
					)}
				</div>
			</div>

			<UploadButton
				isLoading={isLoading}
				handleImageChange={handleImageChange}
				fileInputRef={fileInputRef}
			/>

			<UploadPreviewModal
				isOpen={isModalOpen}
				onSubmit={(newTitle, newDescription) => {
					uploadImage(newTitle, newDescription);
				}}
				onCancel={resetFormAndCloseModal}
				preview={preview}
			/>
		</div>
	);
};

export default ImageList;
