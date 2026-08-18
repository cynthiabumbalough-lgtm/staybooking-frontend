import React from "react";
import {
  Image,
  message,
  Tabs,
  List,
  Typography,
  Form,
  InputNumber,
  DatePicker,
  Button,
  Card,
  Carousel,
  Modal,
} from "antd";
import {
  bookStay,
  cancelReservation,
  getReservations,
  searchStays,
} from "../utils";
import { LeftCircleFilled, RightCircleFilled } from "@ant-design/icons";
import { StayDetailInfoButton } from "./HostHomePage";

const { Text } = Typography;
const { TabPane } = Tabs;

/**
 * Cancel Reservation Button
 */
class CancelReservationButton extends React.Component {
  state = {
    loading: false,
  };

  handleCancelReservation = async () => {
    const { reservationId, onCancelSuccess } = this.props;

    this.setState({
      loading: true,
    });

    try {
      await cancelReservation(reservationId);
    } catch (error) {
      message.error(error.message);
    } finally {
      this.setState({
        loading: false,
      });
    }

    onCancelSuccess();
  };

  render() {
    return (
      <Button
        loading={this.state.loading}
        onClick={this.handleCancelReservation}
        danger={true}
        shape="round"
        type="primary"
      >
        Cancel Reservation
      </Button>
    );
  }
}

/**
 * My Reservations
 */
class MyReservations extends React.Component {
  state = {
    loading: false,
    data: [],
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    this.setState({
      loading: true,
    });

    try {
      const resp = await getReservations();

      this.setState({
        data: resp,
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      this.setState({
        loading: false,
      });
    }
  };

  render() {
    return (
      <List
        style={{
          width: 1000,
          margin: "auto",
        }}
        loading={this.state.loading}
        dataSource={this.state.data}
        renderItem={(item) => (
          <List.Item
            actions={[
              <CancelReservationButton
                onCancelSuccess={this.loadData}
                reservationId={item.id}
              />,
            ]}
          >
            <List.Item.Meta
              title={<Text>{item.listing.name}</Text>}
              description={
                <>
                  <Text>Checkin Date: {item.checkInDate}</Text>
                  <br />
                  <Text>Checkout Date: {item.checkOutDate}</Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  }
}

/**
 * Book Stay Button
 */
class BookStayButton extends React.Component {
  state = {
    loading: false,
    modalVisible: false,
    checkinDate: null,
  };

  handleCancel = () => {
    this.setState({
      modalVisible: false,
      checkinDate: null,
    });
  };

  handleBookStay = () => {
    this.setState({
      modalVisible: true,
      checkinDate: null,
    });
  };

  /**
   * 保存 Book Stay Modal 中的 Check-in Date
   */
  handleCheckinChange = (date) => {
    this.setState({
      checkinDate: date,
    });
  };

  /**
   * Checkout Date 日期限制
   *
   * Checkout 必须晚于 Check-in
   */
  disabledCheckoutDate = (current) => {
    const { checkinDate } = this.state;

    if (!checkinDate) {
      return false;
    }

    return !current.isAfter(checkinDate, "day");
  };

  /**
   * Book Stay
   */
  handleSubmit = async (values) => {
    const { stay } = this.props;

    // 检查日期是否存在
    if (!values.checkin_date || !values.checkout_date) {
      message.error("Please select check-in and check-out dates.");
      return;
    }

    // Checkout 必须晚于 Check-in
    if (!values.checkout_date.isAfter(values.checkin_date, "day")) {
      message.error("Checkout date must be after check-in date.");
      return;
    }

    this.setState({
      loading: true,
    });

    try {
      await bookStay({
        checkInDate: values.checkin_date.format("YYYY-MM-DD"),

        checkOutDate: values.checkout_date.format("YYYY-MM-DD"),

        listingId: stay.id,
      });

      message.success("Successfully booked stay");

      // 预订成功以后关闭 Modal
      this.setState({
        modalVisible: false,
        checkinDate: null,
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      this.setState({
        loading: false,
      });
    }
  };

  render() {
    const { stay } = this.props;

    return (
      <>
        <Button type="primary" shape="round" onClick={this.handleBookStay}>
          Book Stay
        </Button>

        <Modal
          title={stay.name}
          open={this.state.modalVisible}
          onCancel={this.handleCancel}
          footer={null}
          destroyOnClose={true}
        >
          <Form onFinish={this.handleSubmit} layout="vertical">
            <Form.Item
              label="Checkin Date"
              name="checkin_date"
              rules={[
                {
                  required: true,
                  message: "Please select check-in date",
                },
              ]}
            >
              <DatePicker onChange={this.handleCheckinChange} />
            </Form.Item>

            <Form.Item
              label="Checkout Date"
              name="checkout_date"
              rules={[
                {
                  required: true,
                  message: "Please select check-out date",
                },
              ]}
            >
              <DatePicker disabledDate={this.disabledCheckoutDate} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={this.state.loading}
              >
                Book
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }
}

/**
 * Search Stays
 */
class SearchStays extends React.Component {
  state = {
    data: [],
    loading: false,
    checkinDate: null,
  };

  /**
   * Form reference
   */
  formRef = React.createRef();

  /**
   * 当 Check-in Date 改变
   */
  handleCheckinChange = (date) => {
    this.setState({
      checkinDate: date,
    });

    /**
     * 如果新的 Check-in Date 已经晚于
     * 当前 Checkout Date，
     * 就清空 Checkout Date。
     */
    if (date && this.formRef.current) {
      const checkoutDate = this.formRef.current.getFieldValue("checkout_date");

      if (checkoutDate && !checkoutDate.isAfter(date, "day")) {
        this.formRef.current.setFieldsValue({
          checkout_date: null,
        });
      }
    }
  };

  /**
   * 控制 Search Stays 中
   * Checkout Date 可以选择哪些日期
   */
  disabledCheckoutDate = (current) => {
    const { checkinDate } = this.state;

    // 还没有选择 Check-in
    if (!checkinDate) {
      return false;
    }

    // Checkout 必须晚于 Check-in
    return !current.isAfter(checkinDate, "day");
  };

  /**
   * Search
   */
  search = async (query) => {
    /**
     * 1. 检查 Check-in / Checkout 是否存在
     */
    if (!query.checkin_date || !query.checkout_date) {
      message.error("Please select check-in and check-out dates.");
      return;
    }

    /**
     * 2. 检查 Checkout 是否晚于 Check-in
     */
    if (!query.checkout_date.isAfter(query.checkin_date, "day")) {
      message.error("Checkout date must be after check-in date.");
      return;
    }

    this.setState({
      loading: true,
    });

    try {
      const resp = await searchStays(query);

      this.setState({
        data: resp,
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      this.setState({
        loading: false,
      });
    }
  };

  render() {
    return (
      <>
        <Form ref={this.formRef} onFinish={this.search} layout="inline">
          {/* Guest Number */}
          <Form.Item
            label="Guest Number"
            name="guest_number"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} />
          </Form.Item>

          {/* Checkin Date */}
          <Form.Item
            label="Checkin Date"
            name="checkin_date"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker onChange={this.handleCheckinChange} />
          </Form.Item>

          {/* Checkout Date */}
          <Form.Item
            label="Checkout Date"
            name="checkout_date"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker disabledDate={this.disabledCheckoutDate} />
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Button
              loading={this.state.loading}
              type="primary"
              htmlType="submit"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>

        {/* Search Results */}
        <List
          style={{
            marginTop: 20,
          }}
          loading={this.state.loading}
          grid={{
            gutter: 16,
            xs: 1,
            sm: 3,
            md: 3,
            lg: 3,
            xl: 4,
            xxl: 4,
          }}
          dataSource={this.state.data}
          renderItem={(item) => (
            <List.Item>
              <Card
                key={item.id}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      ellipsis={true}
                      style={{
                        maxWidth: 150,
                      }}
                    >
                      {item.name}
                    </Text>

                    <StayDetailInfoButton stay={item} />
                  </div>
                }
                extra={<BookStayButton stay={item} />}
              >
                <Carousel
                  dots={false}
                  arrows={true}
                  prevArrow={<LeftCircleFilled />}
                  nextArrow={<RightCircleFilled />}
                >
                  {item.images.map((image, index) => (
                    <div key={index}>
                      <Image src={image} width="100%" />
                    </div>
                  ))}
                </Carousel>
              </Card>
            </List.Item>
          )}
        />
      </>
    );
  }
}

/**
 * Guest Home Page
 */
class GuestHomePage extends React.Component {
  render() {
    return (
      <Tabs defaultActiveKey="1" destroyInactiveTabPane={true}>
        <TabPane tab="Search Stays" key="1">
          <SearchStays />
        </TabPane>

        <TabPane tab="My Reservations" key="2">
          <MyReservations />
        </TabPane>
      </Tabs>
    );
  }
}

export default GuestHomePage;
