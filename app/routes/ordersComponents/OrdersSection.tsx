import React, {useState} from 'react';
import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
} from '@shopify/polaris';
import type {IndexFiltersProps, TabProps} from '@shopify/polaris';

// Order data shape
export interface Order {
  id: string;
  order: React.ReactNode;
  date: string;
  blanks: string;
  total: string;
  paymentStatus: React.ReactNode;
  fulfillmentStatus: React.ReactNode;
  [key: string]: unknown;
}

// Props for the modular component
export interface OrderSectionProps {
  orders: Order[];
}

const defaultViews = [
  'All',
  'Unpaid',
  'Open',
  'Closed',
  'Delivered',

];
export function OrderSection({ orders }: OrderSectionProps) {
  // Simulate latency
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Tabs (views)
  const [itemStrings, setItemStrings] = useState<string[]>(defaultViews);
  const [selectedView, setSelectedView] = useState<number>(0);

  const deleteView = (index: number) => {
    const newViews = [...itemStrings];
    newViews.splice(index, 1);
    setItemStrings(newViews);
    setSelectedView(0);
  };

  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelectedView(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    id: `${item}-${index}`,
    index,
    isLocked: index === 0,
    onAction: () => setSelectedView(index),
    actions:
      index === 0
        ? []
        : [
            {
              type: 'rename',
              onPrimaryAction: async (value: string) => {
                const newViews = itemStrings.map((v, i) => (i === index ? value : v));
                await sleep(1);
                setItemStrings(newViews);
                return true;
              },
            },
            {
              type: 'duplicate',
              onPrimaryAction: async (value: string) => {
                await sleep(1);
                return duplicateView(value);
              },
            },
            {
              type: 'edit',
            },
            {
              type: 'delete',
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));

  const onCreateNewView = async (value: string) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelectedView(itemStrings.length);
    return true;
  };

  // Sorting options
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Order', value: 'order asc', directionLabel: 'Ascending'},
    {label: 'Order', value: 'order desc', directionLabel: 'Descending'},
    {label: 'Customer', value: 'customer asc', directionLabel: 'A-Z'},
    {label: 'Customer', value: 'customer desc', directionLabel: 'Z-A'},
    {label: 'Date', value: 'date asc', directionLabel: 'Oldest first'},
    {label: 'Date', value: 'date desc', directionLabel: 'Newest first'},
    {label: 'Total', value: 'total asc', directionLabel: 'Low–high'},
    {label: 'Total', value: 'total desc', directionLabel: 'High–low'},
  ];
  const [sortSelected, setSortSelected] = useState<string[]>(['order asc']);

  const {mode, setMode} = useSetIndexFiltersMode();
  const onHandleCancel = () => {};
  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction: IndexFiltersProps['primaryAction'] =
    selectedView === 0
      ? {type: 'save-as', onAction: onCreateNewView}
      : {type: 'save', onAction: onHandleSave};

  // Index resource state
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(orders);

  // Table rows
  const rowMarkup = orders.map((orderItem, index) => (
    <IndexTable.Row
      id={orderItem.id}
      key={orderItem.id}
      selected={selectedResources.includes(orderItem.id)}
      position={index}
    >
      <IndexTable.Cell>{orderItem.order}</IndexTable.Cell>
      <IndexTable.Cell>{orderItem.date}</IndexTable.Cell>
      <IndexTable.Cell>{orderItem.blanks}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" numeric alignment="end">
          {orderItem.total}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{orderItem.paymentStatus}</IndexTable.Cell>
      <IndexTable.Cell>{orderItem.fulfillmentStatus}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  const resourceName = {singular: 'order', plural: 'orders'};

  return (
    <LegacyCard>
      <IndexFilters
        tabs={tabs}
        selected={selectedView}
        onSelect={setSelectedView}
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        onSort={setSortSelected}
        primaryAction={primaryAction}
        cancelAction={{onAction: onHandleCancel}}
        canCreateNewView
        onCreateNewView={onCreateNewView}
        filters={[]}
        appliedFilters={[]}
        onClearAll={() => {}}
        mode={mode}
        setMode={setMode}
        hideFilters
        hideQueryField
        onQueryChange={() => {}}
        disableStickyMode
        onQueryClear={() => {}}
      />
      <IndexTable
        resourceName={resourceName}
        itemCount={orders.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          {title: 'Order'},
          {title: 'Date'},
          {title: 'Blanks model'},
          {title: 'Total', alignment: 'end'},
          {title: 'Payment status'},
          {title: 'Fulfillment status'},
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}

export default OrderSection;
