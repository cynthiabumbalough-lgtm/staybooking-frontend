const domain = "https://staybooking-1046790610796.us-west1.run.app";
//const domain = "http://localhost:8080";
export const login = (credential) => {
  const loginUrl = `${domain}/auth/login`;
  return fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credential),
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to log in");
    }

    return response.json();
  });
};

export const register = (credential) => {
  const registerUrl = `${domain}/auth/register`;
  return fetch(registerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credential),
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to register");
    }
  });
};

export const getReservations = () => {
  const authToken = localStorage.getItem("authToken");
  const listReservationsUrl = `${domain}/bookings`;

  return fetch(listReservationsUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to get reservation list");
    }

    return response.json();
  });
};

export const getStaysByHost = () => {
  const authToken = localStorage.getItem("authToken");
  const listStaysUrl = `${domain}/listings`;

  return fetch(listStaysUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to get stay list");
    }

    return response.json();
  });
};

export const searchStays = (query) => {
  const authToken = localStorage.getItem("authToken");

  // 检查 Token 是否存在
  if (!authToken) {
    throw Error("Authentication failed: Please log in first.");
  }

  const searchStaysUrl = new URL(`${domain}/listings/search`);

  // 统一处理日期，确保格式正确
  const formatDate = (date) => {
    if (!date) throw new Error("Date is missing.");
    if (typeof date.format === "function") {
      return date.format("YYYY-MM-DD");
    }
    if (typeof date === "string") {
      return date;
    }
    throw new Error("Invalid date format.");
  };

  try {
    // 添加查询参数
    searchStaysUrl.searchParams.append("guest_number", query.guest_number);
    searchStaysUrl.searchParams.append(
      "checkin_date",
      formatDate(query.checkin_date),
    );
    searchStaysUrl.searchParams.append(
      "checkout_date",
      formatDate(query.checkout_date),
    );
    searchStaysUrl.searchParams.append("lat", 37);
    searchStaysUrl.searchParams.append("lon", -122);
    searchStaysUrl.searchParams.append("distance", 500000);

    return fetch(searchStaysUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then(async (response) => {
      // 解析后端返回的详细错误信息
      const data = await response.json();
      if (!response.ok) {
        // 抛出后端返回的具体错误，方便调试
        throw new Error(data.message || `Server error: ${response.statusText}`);
      }
      return data;
    });
  } catch (error) {
    throw new Error(`Failed to prepare search request: ${error.message}`);
  }
};

export const deleteStay = (stayId) => {
  const authToken = localStorage.getItem("authToken");
  const deleteStayUrl = `${domain}/listings/${stayId}`;

  return fetch(deleteStayUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to delete stay");
    }
  });
};

export const bookStay = (data) => {
  const authToken = localStorage.getItem("authToken");
  const bookStayUrl = `${domain}/bookings`;

  return fetch(bookStayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to book reservation");
    }
  });
};

export const cancelReservation = (reservationId) => {
  const authToken = localStorage.getItem("authToken");
  const cancelReservationUrl = `${domain}/bookings/${reservationId}`;

  return fetch(cancelReservationUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to cancel reservation");
    }
  });
};

export const getReservationsByStay = (stayId) => {
  const authToken = localStorage.getItem("authToken");
  const getReservationByStayUrl = `${domain}/listings/${stayId}/bookings`;

  return fetch(getReservationByStayUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to get reservations by stay");
    }

    return response.json();
  });
};

export const uploadStay = (data) => {
  const authToken = localStorage.getItem("authToken");
  const uploadStayUrl = `${domain}/listings`;

  return fetch(uploadStayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: data,
  }).then((response) => {
    if (response.status >= 300) {
      throw Error("Fail to upload stay");
    }
  });
};
