import React, { PureComponent, Fragment } from 'react';
import { Form, Row, Button, message, Icon } from 'antd';
import FormEdit from '../../EditDrawer/FormEdit';
import getCellColSpan from '../../common/CellUtil';
import FormItemContainer from '../FormItemContainer';
import './index.css';
import { TRUE } from '../../common/Constants';

class FormContainer extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            expand: false, // 是否展开
            configs: {
                layoutColumn: 1, // 容器列数
                formItemArr: [],
            },
        };
        this.onShowEditForm = this.onShowEditForm.bind(this);
        this.onCloseEditForm = this.onCloseEditForm.bind(this);
        this.renderFormItemContainer = this.renderFormItemContainer.bind(this);
        this.onAddRow = this.onAddRow.bind(this);
        this.onAddRowCell = this.onAddRowCell.bind(this);
        this.onDeleteRow = this.onDeleteRow.bind(this);
        this.onDeleteContainer = this.onDeleteContainer.bind(this);
        this.onDeleteFormItemContainer = this.onDeleteFormItemContainer.bind(this);
        this.onUpdateConfigs = this.onUpdateConfigs.bind(this);
        this.onCollapse = this.onCollapse.bind(this);
        this.colIndexStart = 0;
    }
    onShowEditForm() {
        this.setState({
            visible: true,
            expand: false,
        });
    }
    onCollapse() {
        const { expand } = this.state;
        this.setState({ expand: !expand });
    }
    addNewFormItem(formItemArr, layoutColumnNum, colSpanArr) {
        if (formItemArr.length < layoutColumnNum) {
            for(let i = formItemArr.length; i < layoutColumnNum; i++) {
                formItemArr.push({
                    colIndex: this.colIndexStart + i,
                    colSpan: colSpanArr[i],
                    originSpan: 1,
                });
            }
        }
        return formItemArr;
    }
    onCloseEditForm(configs) {
        const newState = {
            visible: false,
        };
        const { layoutColumn, colSpanArr } = configs;
        const layoutColumnNum = +layoutColumn;
        if (layoutColumnNum) {
            const copyFormItemArr = this.state.configs.formItemArr.slice();
            const formItemArr = this.addNewFormItem(copyFormItemArr, layoutColumnNum, colSpanArr);
            formItemArr.forEach((item) => {
                item.colSpan = getCellColSpan(item.colIndex, item.originSpan, formItemArr, colSpanArr);
            });
            this.colIndexStart += layoutColumnNum;
            configs.layoutColumn = layoutColumnNum;
            configs.formItemArr = formItemArr;
            newState.configs = configs;
        }
        this.setState({
            ...newState
        });
    }
    onAddRowCell() {
        const { configs } = this.state;
        const { colSpanArr } = configs;
        const formItemArr = configs.formItemArr.slice();
        if (formItemArr.length === 0) {
            message.warn('请设置容器列数');
            return;
        }
        const rowSpanCount = formItemArr.reduce((total, item, i) => {
            total += item.colSpan;
            if (i === formItemArr.length -1) {
                total %= 24;
            }
            return total;
        }, 0);
        let colSpanIndex = 0;
        let total = 0;
        for (let i = 0; i < colSpanArr.length; i++) {
            total = total + (+colSpanArr[i]);
            if (total > rowSpanCount) {
                colSpanIndex = i;
                i = colSpanArr.length;
            }
        }
        formItemArr.push({ 
            colIndex: this.colIndexStart,
            originSpan: 1,
            colSpan: colSpanArr[colSpanIndex],
        });
        this.colIndexStart += 1;
        const newConfigs = Object.assign({}, configs);
        newConfigs.formItemArr = formItemArr;
        this.setState({
            configs: newConfigs,
        }, () => {
            const { onUpdateLayoutConfig, layoutIndex } = this.props;
            onUpdateLayoutConfig({ layoutIndex, configs: newConfigs });
        });
    }
    onAddRow() {
        const { configs } = this.state;
        const formItemArr = configs.formItemArr.slice();
        if (formItemArr.length === 0) {
            message.warn('请设置容器列数');
            return;
        }
        const { layoutColumn } = configs;
        for(let i = 0; i < layoutColumn; i++) {
            formItemArr.push({ colIndex: this.colIndexStart + i });
        }
        this.colIndexStart += layoutColumn;
        const newConfigs = Object.assign({}, configs);
        newConfigs.formItemArr = formItemArr;
        this.setState({
            configs: newConfigs,
        }, () => {
            const { onUpdateLayoutConfig, layoutIndex } = this.props;
            onUpdateLayoutConfig({ layoutIndex, configs: newConfigs });
        });
    }
    onDeleteRow() {
        const { configs } = this.state;
        const { layoutColumn, formItemArr } = configs;
        const newConfigs = Object.assign({}, configs);
        const newFormItemArr = formItemArr.slice();
        if (newFormItemArr.length <= layoutColumn) {
            message.warn('不能再删除了');
            return;
        }
        newFormItemArr.length = Math.max(0, newFormItemArr.length- layoutColumn);
        newConfigs.formItemArr = newFormItemArr;
        this.setState({
            configs: newConfigs,
        }, () => {
            const { onUpdateLayoutConfig, layoutIndex } = this.props;
            onUpdateLayoutConfig({ layoutIndex, newConfigs });
        });
    }
    onDeleteContainer() {
        const { onUpdateLayoutConfig, layoutIndex } = this.props;
        onUpdateLayoutConfig({ layoutIndex, deleteFlag: true });
    }
    onDeleteFormItemContainer(colIndex) {
        const { configs } = this.state;
        const { formItemArr } = configs;
        const newConfigs = Object.assign({}, configs);
        const newFormItemArr = formItemArr.filter((item) => {
            return item.colIndex !== colIndex;
        });
        newConfigs.formItemArr = newFormItemArr;
        this.setState({
            configs: newConfigs,
        }, () => {
            const { onUpdateLayoutConfig, layoutIndex } = this.props;
            onUpdateLayoutConfig({ layoutIndex, configs: newConfigs });
        });
    }
    onUpdateConfigs({ deleteFlag = false, ...values }) {
        const { configs } = this.state;
        const { formItemArr, colSpanArr } = configs;
        const newConfigs = Object.assign({}, configs);
        const { onUpdateLayoutConfig, layoutIndex } = this.props;
        const newFormItemArr = formItemArr.reduce((arr, item) => {
            // 删除单元格内的组件
            if (deleteFlag) {
                if (values.colIndex !== item.colIndex) {
                    arr.push(Object.assign({}, item));
                } else {
                    arr.push({
                        colIndex: values.colIndex,
                        colSpan: values.colSpan,
                        originSpan: values.originSpan,
                    });
                }
            } else {
                if (values.colIndex === item.colIndex) {
                    arr.push(Object.assign({}, item, values));
                } else {
                    arr.push(Object.assign({}, item));
                }
            }
            return arr;
        }, []);
        newFormItemArr.forEach((item) => {
            // 更新跨列
            if (item.colIndex > values.colIndex) {
                item.colSpan = getCellColSpan(item.colIndex, item.originSpan,
                    newFormItemArr, colSpanArr);
            }
        });
        const newState = {};
        if (values.type === 'Btn') {
            const { btnArr } = values;
            const expendBtn = btnArr.find((item) => {
                return item.expandFlag === TRUE;
            });
            if (expendBtn) {
                newState.expandCount = + expendBtn.expandCount;
            } else {
                newState.expandCount = 0;
            }
        }
        newConfigs.formItemArr = newFormItemArr;
        newState.configs = newConfigs;
        this.setState({...newState}, () => {
            onUpdateLayoutConfig({ layoutIndex, configs: newConfigs });
        });
    }
    renderFormItemContainer() {
        const { configs, expand, expandCount } = this.state;
        const { formItemArr, layoutColumn } = configs;
        return formItemArr.map(({ colIndex, colSpan, originSpan, cellStyles, type }, i) => {
            // 隐藏组件
            if (expandCount > 0 && !expand && (i+1) > expandCount && type !== 'Btn') {
                return null;
            }
            return (
                <FormItemContainer
                    key={`ed-${colIndex}`}
                    colIndex={colIndex}
                    {...this.props}
                    colSpan={colSpan}
                    expand={expand}
                    originSpan={originSpan}
                    layoutColumn={layoutColumn}
                    cellStyles={cellStyles}
                    onCollapse={this.onCollapse}
                    onDeleteFormItemContainer={this.onDeleteFormItemContainer}
                    onUpdateConfigs={this.onUpdateConfigs}
                />
            );
        });
    }
    render() {
        const { visible, configs } = this.state;
        const { layoutIndex, onUpdateLayoutConfig } = this.props;
        const { layoutColumn, formItemArr } = configs;
        return (
            <Fragment>
                <div className="form-container container">
                    <div className="inner-box">
                        {
                            <Form>
                                <Row
                                    gutter={{ md: 24 / layoutColumn, lg: 24, xl: 48 }}
                                >
                                    {this.renderFormItemContainer()}
                                </Row>
                            </Form>
                        }
                        {
                            formItemArr.length > 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    marginTop: '10px',
                                    }}
                                >
                                    <Button
                                        onClick={this.onAddRowCell}
                                    >
                                        新增单元格
                                    </Button>
                                </div>
                                ) : null
                        }
                    </div>
                    <Icon type="form" className="icon-operation" onClick={this.onShowEditForm} />
                </div>
                <FormEdit
                    visible={visible}
                    onDeleteContainer={this.onDeleteContainer}
                    onClose={(configs) => {
                        const { layoutColumn } = configs;
                        this.onCloseEditForm(configs);
                        if (layoutColumn) {
                            const layoutConfig = {
                                layoutIndex,
                                configs,
                            };
                            onUpdateLayoutConfig(layoutConfig);
                        }
                    }}
                />
            </Fragment>  
        );
    }
}

export default Form.create()(FormContainer);