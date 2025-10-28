import React from "react";
import {
  StyleSheet,
  Page,
  Text,
  Font,
  View,
  Document,
} from "@react-pdf/renderer";
import { Table, TD, TH, TR } from "@ag-media/react-pdf-table";
import Bornomala from "@assets/Bornomala.ttf";

const fmt = (n) =>
  !Number.isFinite(n) ? "0.00" : (Math.round(n * 100) / 100).toFixed(2);

Font.register({
  family: "Bornomala",
  src: Bornomala,
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    fontFamily: "Bornomala",
    color: "#262626",
    fontSize: "12px",
    padding: "30px 50px",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
  },
  textBold: {
    fontFamily: "Bornomala",
    fontWeight: "bold",
  },
  spaceY: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 2,
  },
  billTo: {
    marginBottom: 5,
  },
  table: {
    width: "100%",
    borderColor: "1px solid #f3f4f6",
    margin: "20px 0",
  },
  tableHeader: {
    backgroundColor: "#e5e5e5",
  },
  td: {
    padding: 6,
  },
  totals: {
    display: "flex",
    alignItems: "flex-end",
  },
});

const MemoPDF = ({ memo, calcMemoTotals, parseWhen }) => {
  const totals = calcMemoTotals(memo);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, styles.textBold]}>ক্যাশ মেমো </Text>
            <Text>তারিখ: {parseWhen(memo.createdAt)}</Text>
          </View>
          <View style={styles.spaceY}>
            <Text style={styles.textBold}>মেসার্স রিদওয়ার সরকার ট্রেডার্স</Text>
            <Text>ঈদগাহ কাঁচা রাস্তার মাথা</Text>
            <Text>চট্টগ্রাম, বাংলাদেশ</Text>
          </View>
        </View>

        <View style={styles.spaceY}>
          <Text style={[styles.billTo, styles.textBold]}>ক্রেতার তথ্য</Text>
          <Text>দোকানের নাম: {memo.shopName}</Text>
          <Text>দোকানের ঠিকানা: {memo.shopAddress}</Text>
        </View>

        <Table style={styles.table}>
          <TH style={[styles.tableHeader, styles.textBold]}>
            <TD style={styles.td}>পণ্যের নাম</TD>
            <TD style={styles.td}>বক্স</TD>
            <TD style={styles.td}>কার্টন</TD>
            <TD style={styles.td}>ইউনিটের মূল্য</TD>
            <TD style={styles.td}>ডিসকাউন্ট</TD>
            <TD style={styles.td}>মোট </TD>
          </TH>

          {memo.items.map((it) => {
            const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0);
            const totalCartons = Number(it.totalCartons ?? it.qty ?? 0);
            const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
            const discount = Number(it.discount ?? 0);
            const lineAfter = Math.max(0, unitPrice * totalBoxes - discount);

            return (
              <TR
                style={{ borderBottomWidth: 1 }}
                key={it.productId ?? it.name}
              >
                <TD style={styles.td}>{it.name}</TD>
                <TD style={styles.td}>{totalBoxes.toLocaleString("bn-BD")}</TD>
                <TD style={styles.td}>
                  {totalCartons.toLocaleString("bn-BD")}
                </TD>
                <TD style={styles.td}>
                  {Number(fmt(unitPrice)).toLocaleString("bn-BD")}
                </TD>
                <TD style={styles.td}>
                  {Number(fmt(discount)).toLocaleString("bn-BD")}
                </TD>
                <TD style={styles.td}>
                  {Number(fmt(lineAfter)).toLocaleString("bn-BD")}
                </TD>
              </TR>
            );
          })}
        </Table>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Text style={styles.textBold}>
            মোট: {Number(fmt(totals.total)).toLocaleString("bn-BD")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default MemoPDF;
