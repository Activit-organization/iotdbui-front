import {DingdingOutlined, DownOutlined, EllipsisOutlined, InfoCircleOutlined, PlayCircleOutlined,
  SaveOutlined, PauseCircleOutlined, PlusCircleOutlined, CloseCircleOutlined, FileSearchOutlined,
  ExportOutlined, ImportOutlined, SearchOutlined,} from '@ant-design/icons';
import {Badge, Button, Card, Statistic, Descriptions, Divider, Dropdown, Menu, Popover, Table, Tooltip, Empty,
  notification, Upload, Typography, Form, Input, InputNumber, Popconfirm,} from 'antd';
import { GridContent, PageContainer, RouteContext } from '@ant-design/pro-layout';
import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useRequest, useModel, useIntl } from 'umi';
import { queryAdvancedProfile } from './service';
import { querySqlWithTenantUsingPOST, queryAllUsingPOST,querySaveUsingPOST,
  queryExportCsvWithTenantUsingPOST, querySqlAppendWithTenantUsingPOST, updatePointWithTenantUsingPOST,
 } from '@/services/swagger1/queryController';
import styles from './style.less';
import CommonUtil from '../../../utils/CommonUtil';
import OperationModal from './components/OperationModal';
import AddQueryModal from './components/AddQueryModal';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import {UnControlled as CodeMirror} from '../../../../node_modules/react-codemirror2'
import '../../../../node_modules/codemirror/lib/codemirror.css';
import '../../../utils/iotdb-sql/iotdb-sql';
import '../../../../node_modules/codemirror/theme/juejin.css';
import '../../../../node_modules/codemirror/addon/hint/show-hint.css';
import '../../../../node_modules/codemirror/addon/hint/show-hint';
import '../../../../node_modules/codemirror/addon/hint/sql-hint';
import '../../../../node_modules/codemirror/addon/comment/comment';
import { v4 as uuid } from 'uuid';
import { VList, EditableTable } from '../../../utils/virtual-table'
import {BetterInputNumber} from '../../../utils/BetterInputNumber'
const Self = () => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [querySql, setQuerySql] = useState({'query1':'SHOW STORAGE GROUP'});
  const [activeQueryTabkey, setActiveQueryTabkey] = useState('query1');
  const [readOnly, setReadOnly] = useState(false);
  const [sqlModalVisible, setSqlModalVisible] = useState(false);
  const [sqlModalContent, setSqlModalContent] = useState(undefined);
  const [addQueryVisible, setAddQueryVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [initExportSql, setInitExportSql ] = useState(undefined);
  const wrapTableRef = useRef(null);
  let contentList = null;
  const codeMirror = (
    <CodeMirror
      value={querySql[activeQueryTabkey]}
      options={{
        mode: 'text/iotdb-sql',
        theme: 'juejin',
        autofocus: true,
        lineNumbers: true,
        tabindex: 1,
        extraKeys: {"Alt-/": "autocomplete", "Ctrl-/": "toggleComment"},
        matchBrackets: true,
        readOnly: readOnly,
        indentWithTabs: true,
        smartIndent: true,
        hintOptions: {
          completeSingle: false
        },
      }}
      onChange={(editor, data, value) => {
        if(data.origin!=null&&((data.removed[0].trim()!='') || data.text[0].match(/^[a-zA-Z0-9_]+$/)) ){
          editor.showHint();
        }
        querySql[activeQueryTabkey]=value;
      }}
    />
  );
  const [tabStatus, seTabStatus] = useState({
    tabActiveKey: 'tab1',
    operationKey: 'query1',
  });
  const [resultMessage, setResultMessage] = useState({});
  const resultMessageRef = useRef([]);
  useEffect(() => {
    resultMessageRef.current = resultMessage
  }, [resultMessage])
  const [resultColumn, setResultColumn] = useState([]);
  const resultColumnRef = useRef([]);
  useEffect(() => {
    resultColumnRef.current = resultColumn
  }, [resultColumn])
  const [resultData, setResultData] = useState([]);
  const resultDataRef = useRef([]);
  useEffect(() => {
    resultDataRef.current = resultData
  }, [resultData])
  const [resultSize, setResultSize] = useState([]);
  const [resultTimeCost, setResultTimeCost] = useState([]);
  const [queryToken, setQueryToken] = useState([]);
  const [columns, setColumns] = useState([{}]);
  const [editingKey, setEditingKey] = useState('');
  const [resultLocatorValue, setResultLocatorValue] = useState([]);
  const [editableForm] = Form.useForm();
  const resultLocator =
    <>
    <Divider type="vertical" />
    <span>{intl.formatMessage({id: 'query.result.locate.text',})} </span>
    <BetterInputNumber style={{
      width: 100,
      size: "small",
    }} placeholder="Index.."
      min={0}
      max={10000000}
      onChange={(v)=>{
        resultLocatorValue[activeQueryTabkey]=v;
        setResultLocatorValue({...resultLocatorValue});
      }}
      onPressEnter={()=>{resultLocateTo()}}
     addonAfter={
      <a onClick={()=>{resultLocateTo()}} ><SearchOutlined /></a>
    } />
    </>;
  const resultLocateTo = () => {
    let index = resultLocatorValue[activeQueryTabkey]==null?0:resultLocatorValue[activeQueryTabkey];
    index = index < 1 ? 1 : index;
    let top = 77 * (index - 1);
    wrapTableRef.current.parentNode.scrollTop=top;
  }
  const queryAppend = async() => {
    resultMessageRef.current[activeQueryTabkey]=(
      <>
      <span >
        {`${activeQueryTabkey} ` +
          intl.formatMessage({id: 'query.result.cost.text',})
          + ` ${resultTimeCost[activeQueryTabkey]} ms`}
          <Divider type="vertical" />
        {intl.formatMessage({id: 'query.result.return.text',})
          + ` ${resultSize[activeQueryTabkey]} `
          + intl.formatMessage({id: 'query.result.return.rows',})}
          <Divider type="vertical" />
        {intl.formatMessage({id: 'query.result.load.ing',})}
      </span>
      {resultLocator}
      </>
    );
    let ret = await querySqlAppendWithTenantUsingPOST({queryToken: queryToken[activeQueryTabkey]});
    if(ret.code=='0'){
      resultColumn[activeQueryTabkey]=[];
      let messageJson = JSON.parse(ret.message || '{}');
      let data = ret.data == null? [] : ret.data;
      let l = resultDataRef.current[activeQueryTabkey].length;
      resultSize[activeQueryTabkey]=l+data.length;
      setResultSize({...resultSize});
      if(messageJson.hasMore){
        resultMessageRef.current[activeQueryTabkey]=(
          <>
          <span>
            {`${activeQueryTabkey} ` +
              intl.formatMessage({id: 'query.result.cost.text',}) +
              ` ${resultTimeCost[activeQueryTabkey]} ms`}
              <Divider type="vertical" />
            {intl.formatMessage({id: 'query.result.return.text',})
              + ` ${resultSize[activeQueryTabkey]} `
              + intl.formatMessage({id: 'query.result.return.rows',})}
              <Divider type="vertical" />
          </span>
          <a onClick={() => {queryAppend()}}>{intl.formatMessage({id: 'query.result.load.next',})}</a>
          {resultLocator}
          </>
        );
      }else{
        resultMessageRef.current[activeQueryTabkey]=(
          <>
          <span >
            {`${activeQueryTabkey} ` +
              intl.formatMessage({id: 'query.result.cost.text',})
              + ` ${resultTimeCost[activeQueryTabkey]} ms`}
              <Divider type="vertical" />
            {intl.formatMessage({id: 'query.result.return.text',})
              + ` ${resultSize[activeQueryTabkey]} `
              + intl.formatMessage({id: 'query.result.return.rows',})}
              <Divider type="vertical" />
            {intl.formatMessage({id: 'query.result.load.done',})}
          </span>
          {resultLocator}
          </>
        );
      }
      setResultMessage({...resultMessageRef.current});
      for(let j=0;j<data.length;j++){
        Object.keys(data[j]).map((item,index)=>{
          if(resultColumnRef.current[activeQueryTabkey][item]==null){
            let temp = {title:
              item, editable: true
              , dataIndex: item, width: 200
              , key: item,render: val => {
              return val;}
            };
            resultColumnRef.current[activeQueryTabkey][item] = temp;
            resultColumnRef.current[activeQueryTabkey][resultColumnRef.current[activeQueryTabkey].length]=temp;
          }
        })
        data[j].index = l+j+1;
        resultDataRef.current[activeQueryTabkey][l+j]=data[j];
      }
        resultDataRef.current[activeQueryTabkey] = resultDataRef.current[activeQueryTabkey].slice();
        setResultColumn({...resultColumnRef.current});
        setResultData({...resultDataRef.current});
    }else if(ret.message != null){
      resultMessageRef.current[activeQueryTabkey]=(
        <>
        <span >
          {`${activeQueryTabkey} ` +
            intl.formatMessage({id: 'query.result.cost.text',})
            + ` ${resultTimeCost[activeQueryTabkey]} ms`}
            <Divider type="vertical" />
          {intl.formatMessage({id: 'query.result.return.text',})
            + ` ${resultSize[activeQueryTabkey]} `
            + intl.formatMessage({id: 'query.result.return.rows',})}
            <Divider type="vertical" />
          {`${ret.message}`}
        </span>
        {resultLocator}
        </>
      );
      setResultMessage({...resultMessageRef.current});
    }
  }
  const closeQueryTab = (e2,l) =>{
    e2.preventDefault();
    let temp2 = queryTabList;
    for(let i=0;i<temp2.length;i++){
      if(temp2[i]!=null&&temp2[i].key==('query'+l)){
        temp2[i]=null;
        break;
      }
    }
    temp2 = temp2.filter(item => item != null);
    setQueryTabList(temp2);
    clearEditable();
    setActiveQueryTabkey('queryPlus');
    onOperationTabChange('Plus');
    setReadOnly(true);
  }
  let queryTabIndex = 1;
  const [queryTabList, setQueryTabList] = useState([
    {
      key: 'query1',
      tab:
        <span onClick={
          ()=>{
            setActiveQueryTabkey('query1');
            onOperationTabChange(1);
            clearEditable();
          }
        }
        >{intl.formatMessage({id: 'query.query.text',})+'1'}</span>
    },
    {
      key: 'queryPlus',
      tab: <PlusCircleOutlined onClick={
        (e,v)=>{
          if(queryTabIndex==100){
            alert(intl.formatMessage({id: 'query.query.rule',}));
            return;
          }
          queryTabIndex+=1;
          let temp = queryTabList;
          const l = queryTabList.length;
          temp[l] = temp[l-1];
          temp[l-1] = {
            key: 'query'+queryTabIndex,
            tab: <><span onClick={
                ()=>{
                  setActiveQueryTabkey('query'+(l));
                  onOperationTabChange(l);
                  clearEditable();
                }
              }
              >{intl.formatMessage({id: 'query.query.text',})+queryTabIndex} </span>
              <Popconfirm title="Sure to delete?" onConfirm={(e2) => {closeQueryTab(e2,l);}}>
                <CloseCircleOutlined
                style={{cursor: 'default'}} title='delete'  />
              </Popconfirm>
            </>,
          };
          temp = temp.filter(item => item != null);
          setQueryTabList(temp);
          setActiveQueryTabkey('query'+(l));
          onOperationTabChange(l);
        }
      }/>,
    },
  ]);
  const ButtonGroup = Button.Group;
  const alertQueryTab = () => {
    if(activeQueryTabkey=='queryPlus' || readOnly){
      alert(intl.formatMessage({id: 'query.query.description',}));
      return true;
    }
    return false;
  }
  const clearEditable = () => {
    let t = {};
    Object.keys(editableForm.getFieldsValue()).map((item,index)=>{
        t[item]=null;
    })
    editableForm.setFieldsValue({...t});
    setEditingKey('');
  }
  const runQuery = async() => {
    clearEditable();
    if(alertQueryTab()){ return; };
    resultMessage[activeQueryTabkey]=null;
    setResultMessage({...resultMessage});
    resultColumn[activeQueryTabkey]=[];
    setResultColumn({...resultColumn});
    resultData[activeQueryTabkey]=[];
    setResultData({...resultData});
    if(queryToken[activeQueryTabkey] == null){
      let token = uuid().replaceAll('-','');
      queryToken[activeQueryTabkey]=token;
      setQueryToken({...queryToken});
    }
    let ret = await querySqlWithTenantUsingPOST({sqls: querySql[activeQueryTabkey],
      queryToken: queryToken[activeQueryTabkey]});
    if(ret.code == '0'){
      let messageJson = JSON.parse(ret.message || '{}');
      let data = ret.data == null ? [] : ret.data;
      resultTimeCost[activeQueryTabkey]=messageJson.costMilliSecond == null?0:messageJson.costMilliSecond;
      setResultTimeCost({...resultTimeCost});
      resultSize[activeQueryTabkey]=(data.length);
      setResultSize(resultSize);
      if(messageJson.hasMore){
        resultMessage[activeQueryTabkey]=(
          <>
          <span>
            {`${activeQueryTabkey} ` +
              intl.formatMessage({id: 'query.result.cost.text',})
              + ` ${resultTimeCost[activeQueryTabkey]} ms`}
              <Divider type="vertical" />
            {intl.formatMessage({id: 'query.result.return.text',})
              + ` ${resultSize[activeQueryTabkey]} `
              + intl.formatMessage({id: 'query.result.return.rows',})}
              <Divider type="vertical" />
          </span>
          <a onClick={() => {queryAppend()}}>{intl.formatMessage({id: 'query.result.load.next',})}</a>
          {resultLocator}
          </>
        );
      }else{
        resultMessage[activeQueryTabkey]=(
          <>
          <span >
            {`${activeQueryTabkey} ` +
              intl.formatMessage({id: 'query.result.cost.text',})
              + ` ${resultTimeCost[activeQueryTabkey]} ms`}
              <Divider type="vertical" />
            {intl.formatMessage({id: 'query.result.return.text',})
              + ` ${resultSize[activeQueryTabkey]} `
              + intl.formatMessage({id: 'query.result.return.rows',})}
              <Divider type="vertical" />
            {`${data.length==0?intl.formatMessage({id: 'query.result.execute.done',}):
              intl.formatMessage({id: 'query.result.load.done',})}`}
          </span>
          <span >
          {resultLocator}
          </span >
          </>
        );
      }
      setResultMessage({...resultMessage});
      if(data.length == 0){
        resultColumn[activeQueryTabkey]=[];
        setResultColumn({...resultColumn});
        resultData[activeQueryTabkey]=[];
        setResultData({...resultData});
      }else{
        let columnObj = [];
        for(let i=0;i<data.length;i++){
          if(columnObj['index']==null){
            columnObj['index'] = {title: 'index'
              , editable: false
              , dataIndex: 'index', width:70
              , key: 'index',
              fixed: 'left',
            };
            columnObj[columnObj.length]=columnObj['index'];
          }
          Object.keys(data[i]).map((item,index)=>{
            if(columnObj[item]==null){
              columnObj[item] = {title:item
                , editable:item=='Time'? false: true
                , dataIndex: item, width:item=='Time'?150:190
                , key: item,
                fixed: item=='Time'?'left':false,
              };
              columnObj[columnObj.length]=columnObj[item];
            }
          })
          data[i].index = i+1;
        }
        resultColumn[activeQueryTabkey]=columnObj;
        setResultColumn({...resultColumn});
        resultData[activeQueryTabkey]=data.slice();
        setResultData({...resultData});
      }
    }else{
      resultMessage[activeQueryTabkey]=activeQueryTabkey + ' ' +
        intl.formatMessage({id: 'query.result.execute.failed',});
      setResultMessage({...resultMessage});
      notification.error({
        message: ret.message,
      });
    }
  }

  const showSaveQueryModal = () => {
    if(alertQueryTab()){ return; };
    setAddQueryVisible(true);
  }

  const updatePoint = async(timestamp, point, value) => {
    if(alertQueryTab()){ return; };
    let ret = await updatePointWithTenantUsingPOST({point: point, value: value,
      timestamp: timestamp});
    return ret;
  }

  const showSqlModal = async() => {
    if(alertQueryTab()){ return; };
    let ret = await queryAllUsingPOST({pageSize:10, pageNum: 1});
    CommonUtil.dealCallback(ret, (ret_)=>{
      let index = 0;
      ret_.data.pageItems.map((item)=>{item['key']=index++;});
      setSqlModalContent(ret_.data);
      setSqlModalVisible(true);
    }, notification);
  }
  const exportCsv = (o) => {
    if(o.queryCommand==null || o.queryCommand.trim()==''){
      notification.error({
        message: intl.formatMessage({id: 'query.sql.export.required',}),
      });
      return;
    }
    let url = '/api/query/exportCsv?sqls='+o.queryCommand+'&timeformat='+o.timeformat+'&timeZone='
      +o.timeZone+'&compress='+o.compress+'&targetFile='+(o.targetFile==null?'dump':o.targetFile);
    CommonUtil.download2(url);
  }
  const action = (
    <RouteContext.Consumer>
      {({ isMobile }) => {
        if (isMobile) {
          return (
            <Fragment>
              <ButtonGroup>
                <Button onClick={showSaveQueryModal}><SaveOutlined />
                  {intl.formatMessage({id: 'query.sql.script.save',})}
                </Button>
                <Button onClick={showSqlModal}><FileSearchOutlined />
                  {intl.formatMessage({id: 'query.sql.script.view',})}
                </Button>
                <Button onClick={runQuery} type="primary"><PlayCircleOutlined />
                  {intl.formatMessage({id: 'query.sql.execute',})}
                </Button>
              </ButtonGroup>
            </Fragment>
          );
        }
        return (
          <Fragment>
            <ButtonGroup>
              <Button onClick={runQuery} type="primary"><PlayCircleOutlined />
                {intl.formatMessage({id: 'query.sql.execute',})}
              </Button>
              <Button onClick={showSaveQueryModal}><FileSearchOutlined />
                {intl.formatMessage({id: 'query.sql.script.save',})}
              </Button>
              <Dropdown.Button
                trigger={['hover']}
                onClick={showSqlModal}
                icon={<EllipsisOutlined />}
                overlay={
                <Menu>
                  <Menu.Item key="exportCsv" onClick={() => {
                    setInitExportSql(querySql[activeQueryTabkey]);
                    setExportModalVisible(true);
                  }} ><ExportOutlined /> {intl.formatMessage({id: 'query.sql.export',})}</Menu.Item>
                  <Menu.Item key="importCsv" onClick={() => {
                    setInitExportSql(querySql[activeQueryTabkey]);
                    setImportModalVisible(true);
                  }} ><ImportOutlined /> {intl.formatMessage({id: 'query.sql.import',})}</Menu.Item>
                </Menu>}
                placement="bottomRight"
              >
                <SaveOutlined />{intl.formatMessage({id: 'query.sql.script.view',})}
              </Dropdown.Button>
            </ButtonGroup>
          </Fragment>
        );
      }}
    </RouteContext.Consumer>
  );
  const { loading } = {};
  contentList = {
    'queryPlus':(
      <Table
        pagination={false}
        loading={loading}
        dataSource={[]}
        columns={[]}
        scroll={{ y: 450, scrollToFirstRowOnChange: false }}
        sticky={false}
        components={VList({
          height: 450,
        })}
      />
    )
  };
  for(let i=1;i<100;i++){
    contentList['query'+i]=(
      <EditableTable
        rowKey='index'
        loading={loading}
        columns={resultColumn['query'+i]==null?[]:resultColumn['query'+i]}
        scroll={{ y: 450, scrollToFirstRowOnChange: false }}
        sticky={false}
        pagination={false}
        data={resultData}
        setData={setResultData}
        active={'query'+i}
        editingKey={editingKey}
        setEditingKey={setEditingKey}
        form={editableForm}
        clearEditable={clearEditable}
        updatePoint={updatePoint}
        wrapTableRef={wrapTableRef}
      />
    );
  }

  const onOperationTabChange = (key) => {
    setReadOnly(false);
    seTabStatus({ tabActiveKey: 'tab'+key, operationKey: 'query'+key });
  };

  return (
    <PageContainer
      title={initialState.activeConnectionDesc}
      extra={action}
      className={styles.pageHeader}
      content={codeMirror}
      tabList={queryTabList}
      tabActiveKey={activeQueryTabkey}
    >
      <div className={styles.main}>
        <GridContent>
          <Card
            id='s'
            className={styles.tabsCard}
            title={
              resultMessage[activeQueryTabkey]
            }
            bordered={false}
          >
            {contentList[tabStatus.operationKey]}
          </Card>
        </GridContent>
      </div>
      <OperationModal
        visible={sqlModalVisible}
        setVisible={setSqlModalVisible}
        content={sqlModalContent}
        setContent={setSqlModalContent}
        querySql={querySql}
        setQuerySql={setQuerySql}
        activeQueryTabkey={activeQueryTabkey}
      />
      <AddQueryModal
        visible={addQueryVisible}
        setVisible={setAddQueryVisible}
        querySql={querySql}
        activeQueryTabkey={activeQueryTabkey}
      />
      <ExportModal
        visible={exportModalVisible}
        setVisible={setExportModalVisible}
        exportCsv={exportCsv}
        activeQueryTabkey={activeQueryTabkey}
        initExportSql={initExportSql}
      />
      <ImportModal
        destroyOnClose={true}
        visible={importModalVisible}
        setVisible={setImportModalVisible}
        activeQueryTabkey={activeQueryTabkey}
        initExportSql={initExportSql}
      />
    </PageContainer>
  );
};

export default Self;
