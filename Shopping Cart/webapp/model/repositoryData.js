sap.ui.define([], () => {
	"use strict";

	const REPOSITORY_ID = "5fed39d9-72c0-4308-96dc-608f52ee47f7";
	const PARENT_OBJECT_ID = "LMUnfzOCRUo-HGb4J9aGOBZ0eorEzvckyQLSxvLFCIM";
	const CHILDREN_SERVICE_URL = `/browser/${REPOSITORY_ID}/root?cmisselector=children&objectId=${encodeURIComponent(PARENT_OBJECT_ID)}&filter=${encodeURIComponent("cmis:name,cmis:changeToken")}`;
	const HARDCODED_CATEGORY_ID = "phone";
	const HARDCODED_CATEGORY_NAME = "Phone";

	function buildServiceUrl(sAppModulePath, sRelativeUrl) {
		const sUrl = sRelativeUrl || "";

		if (!sAppModulePath) {
			return sUrl;
		}

		return `${sAppModulePath.replace(/\/$/, "")}${sUrl}`;
	}

	function buildObjectServiceUrl(sObjectId) {
		return `/browser/${REPOSITORY_ID}/root?cmisselector=object&objectId=${encodeURIComponent(sObjectId)}`;
	}

	function requestJson(sUrl) {
		return fetch(sUrl, {
			headers: {
				Accept: "application/json"
			}
		}).then((oResponse) => {
			if (!oResponse.ok) {
				throw new Error(`Request failed for ${sUrl}: ${oResponse.status} ${oResponse.statusText}`);
			}

			return oResponse.json();
		});
	}

	function toArray(vValue) {
		if (Array.isArray(vValue)) {
			return vValue;
		}

		if (vValue && typeof vValue === "object") {
			return Object.values(vValue);
		}

		return [];
	}

	function getObjectIdFromEntry(oEntry) {
		const oObject = oEntry?.object || oEntry || {};
		const mProperties = normalizeProperties(oObject.succinctProperties || oObject.properties || oObject);

		return mProperties["cmis:objectId"] || oEntry?.objectId || "";
	}

	function normalizeProperties(mProperties) {
		if (!mProperties || typeof mProperties !== "object") {
			return {};
		}

		const mNormalized = {};
		Object.keys(mProperties).forEach((sKey) => {
			const vValue = mProperties[sKey];

			if (vValue && typeof vValue === "object" && "value" in vValue) {
				mNormalized[sKey] = vValue.value;
			} else if (vValue && typeof vValue === "object" && "firstValue" in vValue) {
				mNormalized[sKey] = vValue.firstValue;
			} else {
				mNormalized[sKey] = vValue;
			}
		});

		return mNormalized;
	}

	function asNumber(vValue) {
		const iValue = Number(vValue);

		return Number.isFinite(iValue) ? iValue : 0;
	}

	function formatDate(vValue) {
		if (!vValue) {
			return "";
		}

		const iTimestamp = typeof vValue === "number" ? vValue : Number(vValue);
		const oDate = Number.isFinite(iTimestamp) ? new Date(iTimestamp) : new Date(vValue);
		if (Number.isNaN(oDate.getTime())) {
			return String(vValue);
		}

		return oDate.toLocaleString();
	}

	function sanitizeKey(sValue, sFallback) {
		const sNormalized = String(sValue || sFallback || "")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

		return sNormalized || sFallback;
	}

	function parsePrice(vValue) {
		const sValue = String(vValue || "").trim();
		const aMatch = sValue.match(/-?\d+(?:\.\d+)?/);
		const fValue = aMatch ? Number(aMatch[0]) : 0;
		const sCurrency = sValue.replace(aMatch ? aMatch[0] : "", "").trim() || "USD";

		return {
			value: Number.isFinite(fValue) ? fValue : 0,
			currency: sCurrency
		};
	}

	function getProductName(mProperties, sObjectId) {
		return mProperties.sw_model || mProperties["cmis:name"] || sObjectId;
	}

	function getPictureUrl(mProperties, bFolder) {
		if (mProperties.sw_model_image) {
			return mProperties.sw_model_image;
		}

		return bFolder ? "sap-icon://folder-blank" : "sap-icon://document-text";
	}

	function getShortDescription(mProperties, sTimestamp) {
		return [
			mProperties.sw_brand,
			mProperties["cmis:contentStreamMimeType"],
			sTimestamp
		].filter(Boolean).join(" | ");
	}

	function normalizeChild(oEntry) {
		const oObject = oEntry.object || oEntry;
		const mProperties = normalizeProperties(oObject.succinctProperties || oObject.properties || oObject);
		const sObjectId = String(mProperties["cmis:objectId"] || "phone-product-1");
		const oPrice = parsePrice(mProperties.sw_price);
		const sTimestamp = formatDate(mProperties["cmis:lastModificationDate"] || mProperties["cmis:creationDate"]);
		const sName = getProductName(mProperties, sObjectId);
		const sCatalogId = String(mProperties.sw_catalog_id || "1");

		return {
			ProductId: sObjectId,
			ObjectId: sObjectId,
			CatalogId: sCatalogId,
			Category: HARDCODED_CATEGORY_ID,
			CategoryName: HARDCODED_CATEGORY_NAME,
			Name: sName,
			Model: sName,
			Brand: mProperties.sw_brand || "",
			SupplierName: mProperties.sw_brand || "",
			Status: "A",
			TypeLabel: "Document",
			Price: oPrice.value,
			DisplayUnit: oPrice.currency,
			CurrencyCode: oPrice.currency,
			PriceText: String(mProperties.sw_price || ""),
			ShortDescription: getShortDescription(mProperties, sTimestamp),
			MimeType: mProperties["cmis:contentStreamMimeType"] || "",
			LastModifiedBy: mProperties["cmis:lastModifiedBy"] || mProperties["cmis:createdBy"] || "",
			LastModificationDate: sTimestamp,
			PictureUrl: getPictureUrl(mProperties, false),
			RepositoryId: "dms-service",
			RepositoryName: "DMS Service",
			FileName: mProperties["cmis:contentStreamFileName"] || "",
			ContentStreamId: mProperties["cmis:contentStreamId"] || "",
			ContentStreamLength: asNumber(mProperties["cmis:contentStreamLength"]),
			CreatedBy: mProperties["cmis:createdBy"] || "",
			CreationDate: formatDate(mProperties["cmis:creationDate"]),
			SecondaryObjectTypeIds: mProperties["cmis:secondaryObjectTypeIds"] || [],
			ParentIds: mProperties["sap:parentIds"] || []
		};
	}

	async function load(sAppModulePath) {
		const oChildrenPayload = await requestJson(buildServiceUrl(sAppModulePath, CHILDREN_SERVICE_URL));
		const aChildEntries = toArray(
			oChildrenPayload.objects || oChildrenPayload.items || oChildrenPayload.results || oChildrenPayload.children
		);
		const aObjectIds = aChildEntries
			.map(getObjectIdFromEntry)
			.filter(Boolean);
		const aObjectPayloads = await Promise.all(
			aObjectIds.map((sObjectId) => requestJson(buildServiceUrl(sAppModulePath, buildObjectServiceUrl(sObjectId))))
		);
		const aProducts = aObjectPayloads.map(normalizeChild);
		const aCategories = [{
			Category: HARDCODED_CATEGORY_ID,
			CategoryName: HARDCODED_CATEGORY_NAME,
			NumberOfProducts: aProducts.length,
			Products: aProducts
		}];

		return {
			data: {
				ProductCategories: aCategories,
				Products: aProducts
			},
			categoryPathsById: {
				[HARDCODED_CATEGORY_ID]: "/ProductCategories/0"
			},
			productPathsById: aProducts.reduce((mProductPathsById, oProduct, iIndex) => {
				mProductPathsById[oProduct.ProductId] = `/Products/${iIndex}`;
				return mProductPathsById;
			}, {})
		};
	}

	return {
		load
	};
});
